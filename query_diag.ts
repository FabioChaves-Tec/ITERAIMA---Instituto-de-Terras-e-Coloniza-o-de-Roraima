async function main() {
  try {
    const res = await fetch("http://localhost:3000/api/diagnostic");
    const text = await res.text();
    console.log("Response text:", text);
  } catch (err) {
    console.error("Fetch failed:", err);
  }
}

main();
