-- Drop the function if it exists
DROP FUNCTION IF EXISTS create_thrift_account;

-- Create the function with proper permissions
CREATE OR REPLACE FUNCTION create_thrift_account(
  p_user_id UUID,
  p_weekly_amount DECIMAL,
  p_target_amount DECIMAL,
  p_start_date TIMESTAMPTZ,
  p_end_date TIMESTAMPTZ,
  p_referral_id UUID DEFAULT NULL,
  p_registration_fee DECIMAL DEFAULT 3000,
  p_first_week_contribution DECIMAL DEFAULT 2000
) RETURNS thrifts
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_thrift thrifts;
  v_wallet_balance DECIMAL;
  v_total_amount DECIMAL;
BEGIN
  -- Get current wallet balance
  SELECT balance INTO v_wallet_balance
  FROM wallets
  WHERE user_id = p_user_id
  FOR UPDATE;

  -- Calculate total amount needed
  v_total_amount := p_registration_fee + p_first_week_contribution;

  -- Check if user has enough balance
  IF v_wallet_balance < v_total_amount THEN
    RAISE EXCEPTION 'Insufficient wallet balance. Required: %, Available: %', v_total_amount, v_wallet_balance;
  END IF;

  -- Create thrift account
  INSERT INTO thrifts (
    user_id,
    name,
    target_amount,
    weekly_amount,
    start_date,
    end_date,
    status,
    is_primary,
    is_eligible_for_foodstuff,
    referral_id,
    balance,
    current_week,
    has_defaulted,
    default_weeks,
    default_amount,
    is_paid,
    total_withdrawn,
    total_interest,
    total_penalty,
    total_referrals,
    referrals_within_40days,
    active_referrals,
    has_purchased_tshirt,
    clearance_fee_paid,
    fast_track_eligible,
    consecutive_defaults,
    total_contributed
  ) VALUES (
    p_user_id,
    'Thrift Account',
    p_target_amount,
    p_weekly_amount,
    p_start_date,
    p_end_date,
    'active',
    true,
    false,
    p_referral_id,
    p_first_week_contribution, -- Set initial balance to first week's contribution
    1,
    false,
    ARRAY[]::INTEGER[],
    0,
    false,
    0,
    0,
    0,
    0,
    0,
    0,
    false,
    false,
    false,
    0,
    p_first_week_contribution -- Set total_contributed to first week's contribution
  )
  RETURNING * INTO v_thrift;

  -- Deduct from wallet
  UPDATE wallets
  SET balance = balance - v_total_amount
  WHERE user_id = p_user_id;

  -- Create transaction record
  INSERT INTO transactions (
    user_id,
    thrift_id,
    amount,
    type,
    status,
    description,
    metadata,
    reference
  ) VALUES (
    p_user_id,
    v_thrift.id,
    v_total_amount,
    'thrift_registration',
    'completed',
    'Thrift account registration and first week contribution',
    jsonb_build_object(
      'registration_fee', p_registration_fee,
      'first_week_contribution', p_first_week_contribution
    ),
    'THRIFT-' || v_thrift.id
  );

  -- Update referral counts if applicable
  IF p_referral_id IS NOT NULL THEN
    UPDATE thrifts
    SET 
      total_referrals = total_referrals + 1,
      referrals_within_40days = referrals_within_40days + 1,
      active_referrals = active_referrals + 1
    WHERE user_id = p_referral_id;
  END IF;

  RETURN v_thrift;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION create_thrift_account TO authenticated;

-- Add RLS policy to allow users to execute the function
CREATE POLICY "Users can create their own thrift accounts"
  ON thrifts
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id); 