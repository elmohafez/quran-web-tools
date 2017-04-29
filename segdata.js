var suras_offset = 1

var suras = ["الفاتحة", "البقرة", "آل عمران", "النساء", "المائدة", "الأنعام", "الأعراف", "الأنفال", "التوبة", "يونس", "هود", "يوسف", "الرعد", "ابراهيم", "الحجر", "النحل", "الإسراء", "الكهف", "مريم", "طه", "الأنبياء", "الحج", "المؤمنون", "النور", "الفرقان", "الشعراء", "النمل", "القصص", "العنكبوت", "الروم", "لقمان", "السجدة", "الأحزاب", "سبإ", "فاطر", "يس", "الصافات", "ص", "الزمر", "غافر", "فصلت", "الشورى", "الزخرف", "الدخان", "الجاثية", "الأحقاف", "محمد", "الفتح", "الحجرات", "ق", "الذاريات", "الطور", "النجم", "القمر", "الرحمن", "الواقعة", "الحديد", "المجادلة", "الحشر", "الممتحنة", "الصف", "الجمعة", "المنافقون", "التغابن", "الطلاق", "التحريم", "الملك", "القلم", "الحاقة", "المعارج", "نوح", "الجن", "المزمل", "المدثر", "القيامة", "الانسان", "المرسلات", "النبإ", "النازعات", "عبس", "التكوير", "الإنفطار", "المطففين", "الإنشقاق", "البروج", "الطارق", "الأعلى", "الغاشية", "الفجر", "البلد", "الشمس", "الليل", "الضحى", "الشرح", "التين", "العلق", "القدر", "البينة", "الزلزلة", "العاديات", "القارعة", "التكاثر", "العصر", "الهمزة", "الفيل", "قريش", "الماعون", "الكوثر", "الكافرون", "النصر", "المسد", "الإخلاص", "الفلق", "الناس"]
suras.splice(0, suras_offset - 1)

if (typeof raw_text != "undefined"){
  var replacments = [
    {pattern: /^يَا\s+/g, by: 'يَا'},
    {pattern: /^هَا\s+/g, by: 'هَا'},
    {pattern: /\sيَا\s+/g, by: ' يَا'},
    {pattern: /\sهَا\s+/g, by: ' هَا'},
    {pattern: /^وَيَا\s+/g, by: 'وَيَا'},
    {pattern: /\sوَيَا\s+/g, by: ' وَيَا'},
    {pattern: 'يَاابْنَ أُمَّ', by: 'يَاابْنَأُمَّ'},  // taha 94
    {pattern: 'وَأَنْ لَوِ', by: 'وَأَنْلَوِ'} // aljinn 16
  ]
  var text = []
  $.each(raw_text, function(id, row){
    var cols = row.split("\t")
    var sura_id = cols[0]
    var aya_id = cols[1]
    if (typeof text[sura_id] == 'undefined')
      text[sura_id] = []
    var replaced = cols[2]
    $.each(replacments, function(id, replacment){
      replaced = replaced.replace(replacment.pattern, replacment.by)
    })
    text[sura_id][aya_id] = replaced.split(" ")
  })
  var single_letter_tokens = ["ص", "ق", "ن"]
}

var cues_ready = false
var hashes_ready = false

function process_raw_cues(raw_cues) {
  cues = []
  $.each(raw_cues, function(id, row){
    var cols = row.split("\t")
    var sura_id = cols[0]
    var aya_id = cols[1]
    if (typeof cues[sura_id] == 'undefined')
      cues[sura_id] = []
    if (typeof cues[sura_id][aya_id] == 'undefined')
      cues[sura_id][aya_id] = []
    cues[sura_id][aya_id].push({
      start: parseInt(cols[2]),
      duration: parseInt(cols[3]),
      token_id: parseInt(cols[4])
    })
  })
  cues_ready = true
  launch_qaree_if_ready()
}

function process_raw_hashes(raw_hashes) {
  hashes = []
  $.each(raw_hashes, function(id, row){
    var cols = row.split("\t")
    var sura_id = cols[0]
    var aya_id = cols[1]
    if (typeof hashes[sura_id] == 'undefined')
      hashes[sura_id] = []
    hashes[sura_id][aya_id] = cols[2]
  })
  hashes_ready = true
  launch_qaree_if_ready()
  console.log("processed hashes success")
}

var launch_qaree_if_ready = function()
{
  if (cues_ready && hashes_ready)
    aya_select.change()
}


if (typeof raw_glyph_map != 'undefined') {
  var glyph_map = []
  $.each(raw_glyph_map, function(id, row){
    var cols = row.split("\t")
    var page_id = cols[1]
    var sura_id = cols[2]
    var row_type = cols[3]
    var aya_id = cols[4]
    var glyphs = cols[5]
    if (row_type == "1") {
      if (typeof glyph_map[page_id] == 'undefined')
        glyph_map[page_id] = {}
      var key = sura_id + "-" + aya_id
      var old = glyph_map[page_id][key]
      glyph_map[page_id][key] = old ? old + glyphs : glyphs
    }
  })
}

if (typeof raw_quarter_map != 'undefined') {
  var quarter_map = []
  $.each(raw_quarter_map, function(id, row){
    var cols = row.split(" ")
    var page_id = cols[1]
    quarter_map[page_id] = {
      quarter_id: cols[0],
      sura_id: cols[2],
      aya_id: cols[3]
    }
  })
}

