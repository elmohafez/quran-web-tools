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
  201: "سعود الشريم",
  202: "المنشاوي مجود"
}

var qaree_audio_format = function(qaree_id) {
  return qaree_id <= 200 ? "mp3" : "ogg"
}

var qaree_sura_aya_sep = function(qaree_id){
  return qaree_id <= 200 ? "-" : ""
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
      104: "Husary_Muallim_128kbps"
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