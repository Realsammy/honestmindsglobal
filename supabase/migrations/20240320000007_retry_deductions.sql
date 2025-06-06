-- Function to retry a failed deduction
CREATE OR REPLACE FUNCTION retry_failed_deduction(deduction_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_deduction failed_deductions%ROWTYPE;
    v_wallet_balance DECIMAL;
BEGIN
    -- Get the failed deduction record
    SELECT * INTO v_deduction
    FROM failed_deductions
    WHERE id = deduction_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Failed deduction not found';
    END IF;

    -- Check if deduction is already completed
    IF v_deduction.status = 'completed' THEN
        RAISE EXCEPTION 'Deduction is already completed';
    END IF;

    -- Get current wallet balance
    SELECT balance INTO v_wallet_balance
    FROM wallets
    WHERE user_id = v_deduction.user_id
    FOR UPDATE;

    -- Check if user has sufficient balance
    IF v_wallet_balance < v_deduction.amount THEN
        -- Update deduction status to failed
        UPDATE failed_deductions
        SET 
            status = 'failed',
            retry_count = retry_count + 1,
            last_retry_date = NOW()
        WHERE id = deduction_id;
        
        RAISE EXCEPTION 'Insufficient wallet balance';
    END IF;

    -- Begin transaction
    BEGIN
        -- Deduct from wallet
        UPDATE wallets
        SET balance = balance - v_deduction.amount
        WHERE user_id = v_deduction.user_id;

        -- Create transaction record
        INSERT INTO transactions (
            user_id,
            thrift_id,
            amount,
            type,
            status,
            description
        ) VALUES (
            v_deduction.user_id,
            v_deduction.thrift_id,
            v_deduction.amount,
            'deduction',
            'completed',
            'Weekly thrift deduction'
        );

        -- Update deduction status
        UPDATE failed_deductions
        SET 
            status = 'completed',
            retry_count = retry_count + 1,
            last_retry_date = NOW()
        WHERE id = deduction_id;

        -- Commit transaction
        COMMIT;
    EXCEPTION
        WHEN OTHERS THEN
            -- Rollback transaction
            ROLLBACK;
            
            -- Update deduction status to failed
            UPDATE failed_deductions
            SET 
                status = 'failed',
                retry_count = retry_count + 1,
                last_retry_date = NOW()
            WHERE id = deduction_id;
            
            RAISE;
    END;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION retry_failed_deduction TO authenticated;

-- Create policy to allow admins to retry deductions
CREATE POLICY "Admins can retry deductions"
ON failed_deductions
FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM auth.users
        WHERE auth.users.id = auth.uid()
        AND auth.users.raw_user_meta_data->>'role' = 'super_admin'
    )
); 