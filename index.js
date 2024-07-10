require("dotenv").config();
const cron = require("node-cron");
const mysql = require("sync-mysql");
const fs = require("fs");
const dbTables = JSON.parse(fs.readFileSync("./tables.json", "utf8"));

async function sync() {
  const connMaster = new mysql({
    host: process.env.MASTER_HOST,
    user: process.env.MASTER_USER,
    password: process.env.MASTER_PASSWORD,
    database: process.env.MASTER_DATABASE,
  });

  const connSlave = new mysql({
    host: process.env.SLAVE_HOST,
    user: process.env.SLAVE_USER,
    password: process.env.SLAVE_PASSWORD,
    database: process.env.SLAVE_DATABASE,
  });

  let tables = {};

  // List tables
  for (const table in dbTables) {
    let id = dbTables[table];
    // Retrieve the new IDs inserted for each table
    // from the last saved in the Master database
    const sqlMaster =
      "SELECT * FROM " + table + " WHERE id > " + dbTables[table];
    const queryResultMaster = connMaster.query(sqlMaster);

    // If there is new data, synchronize
    if (queryResultMaster.length !== 0) {
      // For each new record
      for (const line in queryResultMaster) {
        id++;
        const register = queryResultMaster[line];
        let fieldList = "";
        let valueList = "";

        // Lists the fields and values ​​to create the query
        // to perform the insertion in the Slave database
        for (const field in register) {
          if (fieldList.length > 0) {
            fieldList += ", ";
            valueList += ", ";
          }
          fieldList += field;
          const value = register[field];
          if (isNaN(value)) {
            valueList += "'" + value + "'";
          } else {
            valueList += value;
          }
        }
        const sqlSlave =
          "INSERT INTO " +
          table +
          "(" +
          fieldList +
          ") VALUES (" +
          valueList +
          ")";
        console.log(sqlSlave);

        try {
          const queryResultSlave = connSlave.query(sqlSlave);
        } catch (error) {
          console.log("Error inserting data into the server:", error.message);
          return {
            synchronized: false,
            tables: {},
          };
        }
      }
    }

    tables[table] = id;
  }

  return {
    synchronized: true,
    tables: tables,
  };
}

// Run every 1 minute
cron.schedule("* * * * *", async () => {
  const result = await sync();
  if (result.synchronized) {
    // Save the file with new data
    const jsonString = JSON.stringify(result.tables);
    fs.writeFile("./tables.json", jsonString, (err) => {
      if (err) {
        console.log("Error saving data.", err);
      } else {
        // console.log("Data saved successfully.");
      }
    });
  }
  console.log("Done synchronizing:", new Date());
});
