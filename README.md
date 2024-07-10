# MySQL Synchronizer

MySQL Synchronizer is a simple way to synchronize two MySQL databases with the same structure.

Notes:
- It considers that all tables have an `id` field with auto increment.
- It's not the best way to do it, but it works.

### Prepare
```bash
cp example.env .env
npm install
```
Note: you need to add your settings in `.env` file.

- In the `tables.json` file, you need to enter all the names of the tables you want to sync and their starting IDs.

### Running
```bash
npm run start
```
