-- Create the make_contribution function
CREATE OR REPLACE FUNCTION public.make_contribution(
    p_thrift_id VARCHAR(13),
    p_amount DECIMAL
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID;
    v_wallet_balance DECIMAL;
    v_thrift thrifts;
BEGIN
    -- Get thrift details by thrift_id (string)
    SELECT * INTO v_thrift
    FROM thrifts
    WHERE thrift_id = p_thrift_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Thrift account not found';
    END IF;

    -- Get user's wallet balance
    SELECT balance INTO v_wallet_balance
    FROM wallets
    WHERE user_id = v_thrift.user_id
    FOR UPDATE;

    -- Check if user has enough balance
    IF v_wallet_balance < p_amount THEN
        RAISE EXCEPTION 'Insufficient wallet balance. Required: %, Available: %', p_amount, v_wallet_balance;
    END IF;

    -- Deduct from wallet
    UPDATE wallets
    SET balance = balance - p_amount
    WHERE user_id = v_thrift.user_id;

    -- Update thrift balance and contribution details
    UPDATE thrifts
    SET 
        balance = balance + p_amount,
        total_contributed = total_contributed + p_amount,
        last_contribution_date = now(),
        next_contribution_date = CASE 
            WHEN next_contribution_date IS NULL THEN now() + interval '7 days'
            ELSE next_contribution_date + interval '7 days'
        END,
        current_week = current_week + 1,
        has_defaulted = false,
        consecutive_defaults = 0
    WHERE thrift_id = p_thrift_id;

    -- Create transaction record
    INSERT INTO transactions (
        user_id,
        thrift_id,
        amount,
        type,
        status,
        description,
        reference
    ) VALUES (
        v_thrift.user_id,
        p_thrift_id,
        p_amount,
        'weekly_contribution',
        'completed',
        'Weekly thrift contribution',
        'CONT-' || p_thrift_id || '-' || now()::text
    );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.make_contribution(VARCHAR, DECIMAL) TO authenticated;