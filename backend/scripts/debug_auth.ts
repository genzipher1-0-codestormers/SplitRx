const API_URL = "http://localhost:3000/api/auth";

async function testAuth() {
  const email = `debug_${Date.now()}@example.com`;
  const password = "Test@123456";

  console.log(`Testing with email: ${email}`);

  try {
    // 1. Register
    console.log("--- Attempting Registration ---");
    const regRes = await fetch(`${API_URL}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        password,
        full_name: "Debug User",
        role: "patient",
      }),
    });

    const regData = await regRes.json(); // Type: any

    if (!regRes.ok) {
      throw new Error(
        `Registration Failed: ${regRes.status} ${JSON.stringify(regData)}`,
      );
    }
    console.log("✅ Registration Successful");

    // 2. Login
    console.log("--- Attempting Login ---");
    const loginRes = await fetch(`${API_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        password,
      }),
    });

    const loginData = await loginRes.json();

    if (!loginRes.ok) {
      throw new Error(
        `Login Failed: ${loginRes.status} ${JSON.stringify(loginData)}`,
      );
    }

    console.log("✅ Login Successful");
    console.log("Response:", loginData);
  } catch (error: any) {
    console.error("❌ Authentication Failed");
    console.error(error.message);
  }
}

testAuth();
