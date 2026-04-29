// src/utils/badWords.js

// Daftar kata kasar dan promosi judi
export const badWords = [
  // KATA KASAR BAHASA INDONESIA
  "anjing",
  "asu",
  "babi",
  "kontol",
  "memek",
  "jembut",
  "ngentot",
  "jancok",
  "cok",
  "bangsat",
  "goblok",
  "tolol",
  "bodoh",
  "idiot",
  "bego",
  "kampret",
  "kampang",
  "kntl",
  "mmk",
  "jablay",
  "lonte",
  "sundel",
  "pepek",
  "tempik",
  "peler",
  "titit",
  "jembud",
  "kimak",
  "bangke",
  "setan",
  "sialan",

  // VARIASI KATA KASAR (dengan pengganti huruf)
  "gblk",
  "tlol",
  "bgsat",
  "kntl",
  "mmk",
  "peler",
  "titit",
  "jembud",
  "angkring",
  "bajingan",
  "brengsek",
  "kampang",
  "kecek",
  "kenthu",

  // JUDI ONLINE (PROMOSI)
  "slot",
  "judi",
  "togel",
  "toto",
  "casino",
  "poker",
  "domino",
  "qiuqiu",
  "sabung ayam",
  "slot online",
  "slot gacor",
  "judi online",
  "togel online",
  "bandar slot",
  "situs slot",
  "slot777",
  "slot88",
  "slot gampang menang",
  "rungkad",
  "scatter",
  "maxwin",
  "bonus slot",
  "deposit slot",
  "judi bola",
  "togel terpercaya",
  "slot terpercaya",
  "agen slot",
  "judol",
  "mpo",
  "mpo slot",
  "slot deposit",
  "slot bonus",
  "slot anti rungkad",

  // KATA KASAR BAHASA INGGRIS
  "fuck",
  "shit",
  "bitch",
  "asshole",
  "bastard",
  "cunt",
  "dick",
  "pussy",
  "whore",
  "slut",
  "fag",
  "motherfucker",
  "damn",
  "hell",
  "cock",

  // VARIASI KATA INGGRIS
  "fck",
  "f*ck",
  "f**k",
  "sht",
  "b*tch",
  "a**hole",
  "b**ch",
  "fcuk",

  // PROMOSI/MENCARI (biasa dipakai spam)
  "beli",
  "jual",
  "murah",
  "discount",
  "promo",
  "gratis",
  "free",
  "daftar",
  "register",
  "join",
  "invite",
  "undang",
  "referral",
  "link",
  "click",
  "klik",
  "subscribe",
  "follow",
  "like",
  "share",
  "donasi",
  "donate",
  "mau",
  "cari",
  "butuh",
  "perlu",
  "nyari",
  "nyariin",
  "order",
  "pesan",
  "whatsapp",
  "wa",
  "telegram",
  "line",
  "instagram",
  "facebook",
  "tiktok",

  // KATA LAIN YANG MENCURIGAKAN
  "teman",
  "kencan",
  "kenalan",
  "jodoh",
  "pacar",
  "single",
  "lajang",
  "virgin",
  "perawan",
  "jaka",
  "gejrot",
  "hotel",
  "kamar",
  "malam",
];

// Fungsi untuk mengecek apakah teks mengandung kata terlarang
export const containsBadWord = (text) => {
  const lowerText = text.toLowerCase();

  for (const word of badWords) {
    // Cek apakah kata muncul (bisa sebagai bagian dari kata lain)
    if (lowerText.includes(word)) {
      return { hasBadWord: true, matchedWord: word };
    }
  }

  return { hasBadWord: false, matchedWord: null };
};

// Fungsi untuk menyensor kata kasar (opsional)
export const censorBadWords = (text) => {
  let result = text;
  for (const word of badWords) {
    const regex = new RegExp(`\\b${word}\\b`, "gi");
    result = result.replace(regex, "*".repeat(word.length));
  }
  return result;
};
