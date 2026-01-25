-- Add 'customer' to user_role enum
alter type user_role add value if not exists 'customer';
