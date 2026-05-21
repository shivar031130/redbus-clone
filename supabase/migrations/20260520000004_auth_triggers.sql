-- Trigger to automatically create profile and operator records on signup

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
    is_operator boolean;
BEGIN
    -- 1. Insert into profiles table
    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (
        new.id,
        new.email,
        new.raw_user_meta_data->>'full_name',
        COALESCE((new.raw_user_meta_data->>'role')::public.user_role, 'client'::public.user_role)
    );

    -- 2. Check if the user is an operator
    is_operator := (new.raw_user_meta_data->>'role') = 'operator';

    -- 3. If operator, insert into operators table
    IF is_operator THEN
        INSERT INTO public.operators (profile_id, company_name, contact_email, status)
        VALUES (
            new.id,
            COALESCE(new.raw_user_meta_data->>'full_name', 'New Operator Company'),
            new.email,
            'pending'
        );
    END IF;

    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
