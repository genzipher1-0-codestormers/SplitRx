import bcrypt from "bcryptjs";

async function generate() {
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash("Test@123456", salt);
  console.log("HASH:", hash);
}

generate();
