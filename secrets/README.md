# Docker Secrets Directory

This directory is used to store sensitive secrets for Docker Compose.

## Setup Instructions

1. Create the following files with your actual secret values:
   - `supabase_service_key.txt` - Your Supabase service role key
   - `supabase_anon_key.txt` - Your Supabase anonymous key

2. Set appropriate permissions:
   ```bash
   chmod 600 secrets/*.txt
   ```

3. Use with Docker Compose:
   ```bash
   docker-compose -f docker-compose.yml -f docker-compose.secrets.yml up
   ```

## Security Notes

- **NEVER** commit actual secret files to Git
- Only `.gitkeep` and this README should be in version control
- Add `secrets/*.txt` to `.gitignore`
- Use strong, unique values for production environments