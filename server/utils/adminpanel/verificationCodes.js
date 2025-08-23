const codes = {}; // Временное in-memory хранилище

function storeCode(email, code) {
  codes[email] = code;
  
  setTimeout(() => {
    delete codes[email];
  }, 5 * 60 * 1000); // 5 минут

  console.log(`✅ Код для ${email}: ${code}`);
  console.log("Текущее хранилище кодов:", codes);

}


function getCode(email) {
  return codes[email];
}

function clearCode(email) {
  delete codes[email];
}

module.exports = {
  storeCode,
  getCode,
  clearCode,
};
