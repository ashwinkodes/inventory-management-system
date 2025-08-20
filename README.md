  Setup Steps

  1. Clone and install dependencies:
  git clone <forked-repo-url>
  cd inventory-management-system
  npm install
  cd Client && npm install && cd ..
  cd Server && npm install && cd ..

  2. Database setup:
  cd Server
  npm run db:generate
  npm run db:push
  npm run db:seed

  3. Start development:
  # From root directory
  npm run dev

  The .env file is configured to use SQLite for development
  - Admin: admin@example.com / admin123
  - Member: member@example.com / member123
