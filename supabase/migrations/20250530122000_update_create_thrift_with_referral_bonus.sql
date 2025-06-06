-- Update create_thrift function to credit referral bonus to sponsor's wallet
-- This migration adds logic to credit a referral bonus when a valid referral ID is used

DROP FUNCTION IF EXISTS public.create_thrift(UUID, UUID);

CREATE OR REPLACE FUNCTION public.create_thrift(
    p_user_id UUID,
    p_referral_id UUID DEFAULT NULL
) RETURNS thrifts
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_thrift thrifts;
    v_wallet_balance DECIMAL;
    v_total_amount DECIMAL;
    v_weekly_amount DECIMAL := 2000.00; -- Default weekly amount
    v_registration_fee DECIMAL := 3000.00; -- Registration fee
    v_start_date TIMESTAMPTZ := now();
    v_end_date TIMESTAMPTZ := now() + interval '52 weeks';
    v_target_amount DECIMAL := v_weekly_amount * 52;
    v_thrift_id VARCHAR(13);
    v_thrift_referral_id TEXT;
    v_sponsor_user_id UUID;
    v_referral_bonus DECIMAL := 1000.00;
BEGIN
    -- Get current wallet balance
    SELECT balance INTO v_wallet_balance
    FROM wallets
    WHERE user_id = p_user_id
    FOR UPDATE;

    -- Calculate total amount needed (registration fee + first week contribution)
    v_total_amount := v_registration_fee + v_weekly_amount;

    -- Check if user has enough balance
    IF v_wallet_balance < v_total_amount THEN
        RAISE EXCEPTION 'Insufficient wallet balance. Required: %, Available: %', v_total_amount, v_wallet_balance;
    END IF;

    -- Generate unique thrift_id
    v_thrift_id := 'HMG' || LPAD(FLOOR(RANDOM() * 10000000000)::TEXT, 10, '0');
    -- Generate unique thrift_referral_id
    v_thrift_referral_id := 'THR-' || substr(md5(random()::text), 1, 8);

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
        total_contributed,
        thrift_id,
        thrift_referral_id
    ) VALUES (
        p_user_id,
        'Thrift Account',
        v_target_amount,
        v_weekly_amount,
        v_start_date,
        v_end_date,
        'active',
        true,
        false,
        p_referral_id,
        v_weekly_amount, -- Set initial balance to first week's contribution
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
        v_weekly_amount, -- Set total_contributed to first week's contribution
        v_thrift_id,
        v_thrift_referral_id
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
        v_thrift.thrift_id,
        v_total_amount,
        'thrift_registration',
        'completed',
        'Thrift account registration and first week contribution',
        jsonb_build_object(
            'registration_fee', v_registration_fee,
            'first_week_contribution', v_weekly_amount
        ),
        v_thrift_id
    );

    -- Update referral counts and credit bonus if applicable
    IF p_referral_id IS NOT NULL THEN
        -- Find sponsor's user_id from the referred thrift
        SELECT user_id INTO v_sponsor_user_id FROM thrifts WHERE id = p_referral_id;
        IF v_sponsor_user_id IS NOT NULL AND v_sponsor_user_id <> p_user_id THEN
            -- Update referral counts
            UPDATE thrifts
            SET 
                total_referrals = total_referrals + 1,
                referrals_within_40days = referrals_within_40days + 1,
                active_referrals = active_referrals + 1
            WHERE id = p_referral_id;

            -- Credit referral bonus to sponsor's wallet
            UPDATE wallets
            SET balance = balance + v_referral_bonus
            WHERE user_id = v_sponsor_user_id;

            -- Record referral bonus transaction for sponsor
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
                v_sponsor_user_id,
                p_referral_id,
                v_referral_bonus,
                'referral_bonus',
                'completed',
                'Referral bonus for inviting a new thrift member',
                jsonb_build_object('referred_user_id', p_user_id, 'new_thrift_id', v_thrift.id),
                v_thrift_id
            );
        END IF;
    END IF;

    RETURN v_thrift;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_thrift(UUID, UUID) TO authenticated;
