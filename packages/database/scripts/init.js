// Initiate replica set
printjson(rs.initiate())

// Wait for the replica set to finish initialization
while (true) {
  const status = rs.isMaster()
  if (status?.ismaster) {
    break
  }
  sleep(1000) // Wait for 1 second before checking again
}

/**
 * Create a user if it doesn't exist, otherwise update the password / roles
 * @param db - the database to create the user in
 * @param username - the username
 * @param password - the password
 * @param roles - the roles, see https://docs.mongodb.com/manual/reference/built-in-roles/
 */
function createUser(db, username, password, roles) {
  if (db.system.users.find({ user: username }).count() <= 0) {
    console.log("Creating user (" + username + ") with roles: " + JSON.stringify(roles))
    db.createUser({
      user: username,
      pwd: password,
      roles: roles,
    })
  } else {
    console.log("User (" + username + ") already exists, Updating password / roles")
    //modify the user password / roles
    db.updateUser(username, {
      pwd: password,
      roles: roles,
    })
  }
}

const adminDb = db.getSiblingDB("admin")

//Create "b3tr" user if it doesn't exist
createUser(adminDb, process.env.MONGO_B3TR_USER, process.env.MONGO_B3TR_PASSWORD, [
  {
    role: "readWrite",
    db: "b3tr",
  },
])

// Create database
console.log("Creating database (b3tr)")
db = db.getSiblingDB("b3tr")
