$(document).ready(function(){
  // init sura select
  var qaree_select = $("#qaree")
  var sura_select = $("#sura")
  aya_select = $("#aya")
  var text_p = $("#text")
  var audio_source = $("#player>source")
  var player = audio_source.parent()
  var timer_id1 = null
  var timer_id2 = null
  var timer_id3 = null
  var silence = $("#silence")
  var cues_debug = $("textarea")
  var audio_source_select = $("#audio_source")
  var auto_advance = $("#auto_advance")
  var total_highlighted_duration = 0
  var sync_error = $("#sync_error")
  var playback_rate_select = $("#playback_rate")
  var single_mode = false

  var load_data_for_qaree = function()
  {
    var qaree_id = qaree_select.val()
    if (!qaree_id) return
    cues_ready = false
    hashes_ready = false
    if (qaree_audio_is_secure(qaree_id))
      load_js_data("./QuranHash/qaree" + qaree_id + ".js")
    else
      hashes_ready = true
    load_js_data("./QuranSeg/qaree" + qaree_id + ".js")
  }

  var update_cookie = function()
  {
    $.cookie('sura_id', sura_select.val(), { expires: 30 });
    $.cookie('aya_id', aya_select.val(), { expires: 30 });
    $.cookie('audio_source', audio_source_select.val(), { expires: 30 });
  }

  var read_cookie = function()
  {
    var qaree_id = 0
    var sura_id = $.cookie('sura_id') || 1
    var aya_id = $.cookie('aya_id') || 1
    var audio_source = $.cookie('audio_source') || 'absolute'

    qaree_select.val(qaree_id)
    set_download_link()
    sura_select.val(sura_id).change()
    aya_select.val(aya_id)
    audio_source_select.val(audio_source).change()
  }

  player.bind("play", function(){
    if (single_mode) return
    playback_rate_select.change()
    highlight_token(sura_select.val(), aya_select.val(), 0, 0)
  })

  player.bind("ended", function(){
    if ($("#auto_advance:checked").length > 0) {
      advance_aya()
    }
  })

  player.bind("pause", function() {
    stop_all()
  })

  player = player.get(0)
  player.autoplay = true

  // cues_debug.hide()
  //sync_error.parent().hide()
  // audio_source_select.hide()
  //auto_advance.hide()
  audio_source_select.val("absolute")
  //player.controls = false

  // populate suras
  var options = ""
  $.each(suras, function(id, sura){
    options += "<option value='"+(id+suras_offset)+"'>"+(id+suras_offset)+" - "+sura+"</option>"
  })
  sura_select.append(options)

  // populate qaree
  var options = ""
  $.each(qaree, function(qaree_id, qaree_name){
    options += "<option value='"+qaree_id+"'>"+qaree_id+" - "+qaree_name+"</option>"
  })
  qaree_select.append(options)  

  playback_rate_select.change(function(){
    player.playbackRate = $(this).val()
  })

  qaree_select.change(function(){
    if (audio_is_relative()) {
      display_relative_audio_instructions()
      set_download_link()
    }

    update_cookie()
    load_data_for_qaree()
  })

  sura_select.change(function(){
    var sura_id = $(this).val()
    var options = ""
    var aya_count = text[sura_id].length - 1
    for(var i = 1; i <= aya_count; i++)
      options += "<option value='"+i+"'>"+i+"</option>"
    aya_select.empty().append(options)//.change()
  }).change()

  var audio_is_relative = function() {
    return audio_source_select.val() == 'relative'
  }

  var display_relative_audio_instructions = function() {
    var qaree_name = $('option:selected', qaree_select).text().split(" - ")[1]
    var qaree_id = qaree_select.val()

    alert("يجب وضع مجلد يحتوي على الملفات الصوتية للقارئ "
      +qaree_name+" يكون اسمه "+qaree_id
      +" ويوضع تحت المجلد quran-audio والذي يوضع بدوره بجانب مجلد الصفحة segdemo"
      +"\n\nمثال:\n"
      +"Dropbox/segdemo/index.html\n"
      +"Dropbox/quran-audio/"+qaree_id+"/001-001.mp3\n"
      +"Dropbox/quran-audio/"+qaree_id+"/001-002.mp3\n"
      +"...\n"
      +"وهكذا\n"
      +"سيظهر رابط لتحميل المفات الصوتية دفعة واحدة بعد إغلاق هذه الرسالة"
    )
  }

  var set_download_link = function() {
    var qaree_id = qaree_select.val()
    var url = qaree_zip_url(qaree_id)
    console.log(url)
    $("#audio_download_link").show()
      .find("a").attr("href", url)
  }

  audio_source_select.change(function(){
    if (audio_is_relative()) {
      display_relative_audio_instructions()
      set_download_link()
    }
    else {
      $("#audio_download_link").hide()
    }
    var sura_id = sura_select.val()
    var aya_id = aya_select.val()
    update_cookie()
    update_audio_source(sura_id, aya_id)
  })

  var get_relative_url = function(qaree_id, sura_id, aya_id) {
    var relative_file = zero_pad(sura_id) + qaree_sura_aya_sep(qaree_id)
      + zero_pad(aya_id) + "." + qaree_audio_format(qaree_id)
    return "../quran-audio/" + qaree_id + "/" + relative_file
  }

  var get_absolute_url = function(qaree_id, sura_id, aya_id) {
    var base_url = qaree_audio_base_url(qaree_id)
    if (qaree_audio_is_secure(qaree_id)) {
      var hash = hashes[sura_id][aya_id]
      return base_url + hash[0] + "/" + hash
        + "." + qaree_audio_format(qaree_id)
    }
    else
      return base_url + zero_pad(sura_id) + zero_pad(aya_id)
        + "." + qaree_audio_format(qaree_id)
  }
  
  var update_audio_source = function(sura_id, aya_id){
    var qaree_id = qaree_select.val()
    if (!qaree_id) return

    var url
    if (audio_is_relative())
      url = get_relative_url(qaree_id, sura_id, aya_id)
    else
      url = get_absolute_url(qaree_id, sura_id, aya_id)

    console.log("loading audio from file", url)
    total_highlighted_duration = 0
    audio_source.attr("src", url).appendTo(audio_source.parent())
    player.load()
  }

  var highlight_token = function(sura_id, aya_id, cue_sequence, earlier_by) {
    var seq = cues[sura_id][aya_id][cue_sequence]
    if (!seq) return; // done with all tokens in this aya
    if (seq.token_id >= 0)
      $("#token_" + seq.token_id).addClass("token_active")
    else
      silence.show()

    timer_id1 = setTimeout(function(){
      total_highlighted_duration += seq.duration
      earlier_by = total_highlighted_duration - player.currentTime * 1000

      sync_error.html(Math.round(earlier_by))
      console.log("total_highlighted_duration: %o, player currentTime: %o", total_highlighted_duration, player.currentTime * 1000)
      console.log("sequence %o, sync_error: %o", cue_sequence, earlier_by)

      if (earlier_by >= 100) {
        timer_id2 = setTimeout(function(){
          unhighlight_token(sura_id, aya_id, cue_sequence, 0)
        }, earlier_by)
      }
      else
        unhighlight_token(sura_id, aya_id, cue_sequence, earlier_by)
    }, seq.duration / playback_rate_select.val() + earlier_by)
  }

  var unhighlight_token = function(sura_id, aya_id, cue_sequence, earlier_by) {
    var seq = cues[sura_id][aya_id][cue_sequence]
    if (seq.token_id >= 0)
      $("#token_" + seq.token_id).removeClass("token_active")
    else
      silence.hide()

    if (!single_mode)
      highlight_token(sura_id, aya_id, cue_sequence + 1, earlier_by)
    else
      player.pause()
    single_mode = false
  }

  var advance_aya = function() {
    var sura_id = parseInt(sura_select.val())
    var aya_id = parseInt(aya_select.val())
    var aya_count = text[sura_id].length - 1
    if (aya_id < aya_count)
      aya_select.val(aya_id+1+"").change()
    else if (sura_id < 114)
      sura_select.val(sura_id+1+"").change()
  }

  var stop_all = function() {
    if (timer_id1) clearTimeout(timer_id1)
    if (timer_id2) clearTimeout(timer_id2)
    if (timer_id3) clearTimeout(timer_id3)

    $(".token").removeClass("token_active")

    //player.currentTime = 0
  }

  aya_select.change(function(){
    stop_all();

    var sura_id = sura_select.val()
    var aya_id = $(this).val()

    update_audio_source(sura_id, aya_id)
    update_cookie()

    var tokens = text[sura_id][aya_id]
    var span = ""
    var span_id = 0
    var window_width = $(window).width()
    text_p.empty()
    $.each(tokens, function(id, token){
      if (token.length > 1 || single_letter_tokens.indexOf(token) >= 0) {
        span = "<span class='token' id='token_"+span_id+"'>"+token+"&nbsp;</span>"
        text_p.append(span)
        if (text_p.width() > window_width)
          $("<BR/><BR/>").insertBefore($("#token_"+span_id))
        span_id++
      }
    })
    cues_debug.val(JSON.stringify(cues[sura_id][aya_id]))
  })

  $("#text").on("click", ".token", function(){
    stop_all()

    var sura_id = sura_select.val()
    var aya_id = aya_select.val()

    var id = parseInt($(this).attr("id").split("_")[1])

    var cue_sequence = 0
    var seq = null

    $.each(cues[sura_id][aya_id], function(index, item){
      if (item.token_id == id) {
        cue_sequence = index
        seq = item
        console.log("found sequence %o", seq)
        return false
      }
    })

    if (seq) {
      player.currentTime = seq.start / 1000.0
      total_highlighted_duration = 0
      single_mode = ! ($("#auto_advance:checked").length > 0)
      player.play()
      highlight_token(sura_id, aya_id, cue_sequence, 0)
    }
  })

  $("#report").click(function(){
    stop_all();
    player.pause();
    var qaree_id = qaree_select.val()
    var sura_id = sura_select.val()
    var sura_name = $('option:selected', sura_select).text()
    var qaree_name = $('option:selected', qaree_select).text()
    var aya_id = aya_select.val()
    var info = "الشيخ " + qaree_name + " سورة " + sura_name + " الآية " + aya_id + "؟"
    var default_note = "(اختياري) تفاصيل الخطأ";
    $(this).hide();
    var sync_error_val = parseInt(sync_error.html())
    if (sync_error_val >= 200)
      show_alert($("#warning"), "تأكد من سرعة الاتصال بالإنترنت ومن كفاءة الجهاز قبل الإبلاغ")
    else if (note = prompt("هل أنت متأكد من أن هناك خطأ في " + info, default_note)) {
      $.ajax({
        url: 'http://elmohafez.com/segdemo/report.php',
        type: 'POST',
        data: {qaree_id: qaree_id, sura_id: sura_id, aya_id: aya_id, note: note == default_note ? "" : note},
        success: function(){
          show_alert($("#success"))
        },
        error: function(){
          show_alert($("#error"))
        }
      })
    }
    else {
      show_alert($("#warning"))
    }
  })

  read_cookie()
  load_data_for_qaree()
})
