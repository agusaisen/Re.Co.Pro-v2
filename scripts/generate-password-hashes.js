import bcrypt from "bcryptjs"

// Contraseñas que quieres usar
const passwords = {
  "aaisen@neuquen.gov.ar": "jyd$$753", // Cambia por la contraseña real que quieres
  "gestor@neuquen.gov.ar": "gestor123", // Cambia por la contraseña real que quieres
}

console.log("Generando hashes de contraseñas...\n")

for (const [email, password] of Object.entries(passwords)) {
  const hash = await bcrypt.hash(password, 10)
  console.log(`Email: ${email}`)
  console.log(`Contraseña: ${password}`)
  console.log(`Hash: ${hash}`)
  console.log("---")
}

// También verificar los hashes actuales de la base de datos
const currentHashes = {
  "admin@neuquen.gov.ar": "$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi",
  "gestor@plottier.gov.ar": "$2b$10$N9qo8uLOickgx2ZMRZoMye.fgsuzanjHH/NYh50wjjIxN.2e7u2dS",
}

console.log("\nVerificando hashes actuales de la base de datos:")
for (const [email, hash] of Object.entries(currentHashes)) {
  for (const [testEmail, testPassword] of Object.entries(passwords)) {
    if (email === testEmail) {
      const isValid = await bcrypt.compare(testPassword, hash)
      console.log(`${email} con contraseña "${testPassword}": ${isValid ? "VÁLIDA" : "INVÁLIDA"}`)
    }
  }
}
