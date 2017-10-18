var qaree = {
  1: "محمد صديق المنشاوي",
  5: "محمد أيوب",
  7: "إبراهيم الأخضر",
  8: "عبدالله بصفر",
  9: "علي عبدالرحمن الحذيفي",
  101: "محمد الطبلاوي",
  102: "عبد الباسط عبد الصمد",
  103: "محمود خليل الحصري",
  104: "المصحف المعلم للحصري",
  // 105: "محمود خليل الحصري - جودة عالية",
  // 106: "ياسر سلامة - حدرا",
  // 107: "محمود صديق المنشاوي - جودة عالية",
  // 108: "مشاري راشد العفاسي",

  111: "عبد الباسط عبد الصمد (مرتل)",
  112: "عبد الله عواد الجهني",
  113: "عبد الله بصفر",
  114: "عبد الله المطرود",
  115: "عبد الرحمن السديس",
  116: "أبو بكر الشاطري",
  117: "أحمد بن علي العجمي",
  118: "أحمد نعينع",
  119: "أكرم العلقمي",
  120: "مشاري راشد العفاسي",
  121: "علي حجاج السويسي",
  122: "علي جابر",
  123: "عبد العزيز عليلي",
  124: "فارس عباد",
  125: "سعد الغامدي",
  126: "هاني رفاعي",
  127: "علي عبد الرحمن الحذيفي",
  128: "محمود خليل الحصري",
  129: "إبراهيم الأخضر",
  130: "كريم منصوري",
  131: "خليفة الطنيجي",
  132: "خالد عبد الله القحطاني",
  133: "ماهر المعيقلي",
  134: "محمود علي البنا",
  135: "محمد صديق المنشاوي (مجود)",
  136: "محمد الطبلاوي",
  137: "محمد عبد الكريم",
  138: "محمد أيوب",
  139: "محمد جبريل",
  140: "محسن القاسم",
  141: "ناصر القطامي",
  142: "سهل ياسين",
  143: "صلاح بو خاطر",
  144: "صلاح البدير",

  201: "سعود الشريم",
  202: "المنشاوي مجود"
}

// 105-108: missing qaree<id>.js timing files

var qaree_audio_format = function(qaree_id) {
  return qaree_id <= 200 ? "mp3" : "ogg"
}

var qaree_audio_base_url = function(qaree_id){
  var rewaya_id = 1 // for now only Hafss!
  if (qaree_id <= 200)
    return "http://audio.elmohafez.com/" + rewaya_id + "-" + qaree_id + "/"
  else {
    var names = {
      201: "Shuraym",
      202: "Minshawi/Mujawwad"
    }
    return "http://verses.quran.com/"+names[qaree_id]+"/ogg/"
  }
}

var qaree_zip_url = function(qaree_id){
  if (qaree_audio_is_secure(qaree_id))
    return "https://s3-us-west-2.amazonaws.com/hammadypublic/quran-audio/"+qaree_id+".zip"
  else if (qaree_id <= 200){
    var names = {
      101: "Mohammad_al_Tablaway_128kbps",
      102: "Abdul_Basit_Murattal_64kbps",
      103: "Husary_64kbps",
      104: "Husary_Muallim_128kbps",

      111: "Abdul_Basit_Murattal_64kbps",
      112: "Abdullaah_3awwaad_Al-Juhaynee_128kbps",
      113: "Abdullah_Basfar_32kbps",
      114: "Abdullah_Matroud_128kbps",
      115: "Abdurrahmaan_As-Sudais_192kbps",
      116: "Abu_Bakr_Ash-Shaatree_128kbps",
      117: "ahmed_ibn_ali_al_ajamy_128kbps",
      118: "Ahmed_Neana_128kbps",
      119: "Akram_AlAlaqimy_128kbps",
      120: "Alafasy_128kbps",
      121: "Ali_Hajjaj_AlSuesy_128kbps",
      122: "Ali_Jaber_64kbps",
      123: "aziz_alili_128kbps",
      124: "Fares_Abbad_64kbps",
      125: "Ghamadi_40kbps",
      126: "Hani_Rifai_192kbps",
      127: "Hudhaify_128kbps",
      128: "Husary_64kbps",
      129: "Ibrahim_Akhdar_32kbps",
      130: "Karim_Mansoori_40kbps",
      131: "khalefa_al_tunaiji_64kbps",
      132: "Khaalid_Abdullaah_al-Qahtaanee_192kbps",
      133: "Maher_AlMuaiqly_64kbps",
      134: "mahmoud_ali_al_banna_32kbps",
      135: "Minshawy_Mujawwad_192kbps",
      136: "Mohammad_al_Tablaway_128kbps",
      137: "Muhammad_AbdulKareem_128kbps",
      138: "Muhammad_Ayyoub_128kbps",
      139: "Muhammad_Jibreel_128kbps",
      140: "Muhsin_Al_Qasim_192kbps",
      141: "Nasser_Alqatami_128kbps",
      142: "Sahl_Yassin_128kbps",
      143: "Salaah_AbdulRahman_Bukhatir_128kbps",
      144: "Salah_Al_Budair_128kbps"
    }
    return "http://www.everyayah.com/data/"+names[qaree_id]+"/000_versebyverse.zip"
  }
  else {
    var names = {
      201: "shuraym",
      202: "minshawi_mujawwad"
    }
    return "http://makkah-dl.quranicaudio.com/quran/vbv/"+names[qaree_id]+".zip"
  }
}