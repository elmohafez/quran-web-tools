$(document).ready(function(){
  var page_select = $("#page")
  var text_container = $("#glyph_text")
  var color_sel = null
  var color_chooser = $("#color_chooser")
  var color_count = 6
  var color_chooser_classnames = ""
  var highlight_start = null
  var db = new QuranHighlightsStore()

  // init page numbers select
  var options = ""
  for(var i = 1; i <= 604; i++)
    options += "<option value='"+i+"'>"+i+"</option>"
  page_select.empty().append(options)

  // attach events to prev/next page
  $("#prev_page").click(function(){
    var page = parseInt(page_select.val())
    if (page > 1)
      page_select.val(page - 1).change()
  })
  $("#next_page").click(function(){
    var page = parseInt(page_select.val())
    if (page < 604)
      page_select.val(page + 1).change()
  })

  // reload last location or start from page 1
  var update_cookie = function(page_id)
  {
    $.cookie('page_id', page_id, { expires: 30 });
  }

  var read_cookie = function()
  {
    var page_id = $.cookie('page_id') || 1
    page_select.val(page_id).change()
  }

  var render_glyph_matching = function(page_id, info)
  {
    var div = "<div><table>", i = 1
    var normal_text_tokens = text[info.sura_id][info.aya_id]
    $.each(info.glyphs, function(glyph_id, glyph){
      div += "<tr>"
      div += "<td>"+i+"</td>"
      div += "<td class='glyph P_"+page_id+"'>"+glyph+"</td>"
      div += "<td>"+normal_text_tokens[i-1]+"</td>"
      div += "</tr>"
      i++
    })
    div += "</table></div>"
    return div
  }

  var render_highlight = function(page_id, info)
  {
    var div = "<div sura_aya_ids='"+info.sura_id+"-"+info.aya_id+"'>", i = 0
    $.each(info.glyphs, function(glyph_id, glyph){
      div += "<span glyph_id='"+i+"' class='noselect glyph P_"+page_id+"'>"+glyph+"</span>"
      i++
    })
    div += "</div>"
    return div
  }

  var same_verse = function(info1, info2)
  {
    return info1.sura_id == info2.sura_id && info1.aya_id == info2.aya_id
  }

  var update_total_highlights_count = function()
  {
    db.select_highlights_count().then(function(count){
      $("#download_highlights").text("Download " + count + " records")
    })
  }
  update_total_highlights_count()

  var load_highlights = function(page_id)
  {
    // load from db and apply on spans
    db.select_highlights(page_id).each(function(highlight){
      var div = $("div[sura_aya_ids='"+highlight.sura_aya_ids+"']")
      $("span.glyph", div).each(function(){
        var span = $(this),
            glyph_id = parseInt(span.attr("glyph_id")),
            start_glyph_id = parseInt(highlight.start_glyph_id),
            end_glyph_id = parseInt(highlight.end_glyph_id)
        if (glyph_id >= start_glyph_id && glyph_id <= end_glyph_id) {
          span.addClass("color_chooser_c" + highlight.color)
          span.data("persist", highlight.color)
        }
      })
    })
  }

  // render page
  page_select.change(function(){
    var page_id = $(this).val()
    text_container.empty()
    highlight_start = null

    $.each(extract_glyphs(page_id), function(info_id, info){
      var sura_name = suras[parseInt(info.sura_id) - 1]
      var h3 = "<h3>سورة " + sura_name + " - الآية " + info.aya_id + "</h3>"
      var div = $(mode == 'highlight' ? render_highlight(page_id, info) : render_glyph_matching(page_id, info))
      text_container.append(h3)
      text_container.append(div)
      if (mode == 'highlight') {
        // add delete link
        var del_link = $("<a style='cursor: pointer'>[مسح التظليل]</a>")
        del_link.click(function(){
          db.delete_highlights(info.sura_id, info.aya_id)
          .then(function(){
            // remove background colors and data from spans
            update_total_highlights_count()
            $("span.glyph", div)
              .removeData("persist")
              .removeClass(color_chooser_classnames)
          })
        })
        text_container.append(del_link)
      }
      div.data("info", info)
    })
    var font_name = 'QCF_P' + zero_pad(page_id)
    $(".glyph", text_container).fontface({
      fontName: font_name,
      fileName: font_name,
      fontFamily: font_name
    })

    // highlight specific events
    if (mode == 'highlight') {
      $("span.glyph")
      .on("mouseover", function(){
        var span = $(this)
        // return if hovering a persisted span
        if (span.data("persist"))
          return
        // give span selected color
        span.addClass("color_chooser_c" + color_sel)
        // persist span if highlight has started and within same verse
        if (highlight_start && same_verse(span.parent().data("info"), highlight_start.info)) {
          span.data("persist", color_sel)
        }
      })
      .on("mouseout", function(){
        if (!$(this).data("persist"))
          $(this).removeClass("color_chooser_c" + color_sel)
      })
      .on("mousedown", function(){
        var span = $(this), div = span.parent()
        span.data("persist", color_sel)
        highlight_start = {
          info: div.data("info"),
          glyph_id: span.attr("glyph_id")
        }
      })
      .on("mouseup", function(){
        var span = $(this), div = span.parent(),
            s = parseInt(highlight_start.glyph_id),
            e = parseInt(span.attr("glyph_id"))
        var start_glyph_id = Math.min(s, e),
            end_glyph_id = Math.max(s, e)
        db.insert_highlight({
          page_id: page_id,
          sura_id: highlight_start.info.sura_id,
          aya_id: highlight_start.info.aya_id,
          start_glyph_id: start_glyph_id,
          end_glyph_id: end_glyph_id,
          color: span.data("persist")
        })
        .then(update_total_highlights_count)
        highlight_start = null
      })
      load_highlights(page_id)
    }

    update_cookie(page_id)
  })

  // create color chooser
  for(var c = 0; c < color_count; c++){
    color_chooser.append("<span color_id='"+c+"' class='color_chooser_c"+c+"'></span>")
    color_chooser_classnames += " color_chooser_c" + c
  }
  $("span", color_chooser).click(function(){
    // unselect previous selected
    $("span", color_chooser).removeClass("color_sel")
    // select new span
    var span = $(this)
    color_sel = span.attr("color_id")
    span.addClass("color_sel")
  })
  $("span:first", color_chooser).click()

  $("#report").click(function(){
    var page_id = page_select.val()
    var default_note = "(اختياري) تفاصيل الخطأ";
    $(this).hide();
    if (note = prompt("هل أنت متأكد من أن هناك خطأ في صفحة" + page_id, default_note)) {
      $.ajax({
        url: 'http://elmohafez.com/segdemo/report2.php',
        type: 'POST',
        data: {page_id: page_id, note: note == default_note ? "" : note},
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

  $("#autodetect").click(function(){
    if (confirm("Try to autodetect errors by matching word counts? This may take some time")) {
      var errors = []
      // detect errors
      for(var page_id = 1; page_id <= 604; page_id++) {
        $.each(extract_glyphs(page_id), function(info_id, info){
          var normal_text_tokens = text[info.sura_id][info.aya_id]
          if (normal_text_tokens.length != info.glyphs.length) {
            errors.push({
              page_id: page_id,
              sura_id: info.sura_id,
              sura_name: suras[parseInt(info.sura_id) - 1],
              aya_id: info.aya_id
            })
          }
        })
      }
      // show errors
      if (errors.length > 0) {
        var table = "<table><tr><th>Page</th><th>SuraId</th><th>SuraName</th><th>Aya</th></t>"
        $.each(errors, function(id, error) {
          table += "<tr><td><a class='page_pointer'>"+error.page_id+"</a></td>"
          table += "<td>"+error.sura_id+"</td>"
          table += "<td>"+error.sura_name+"</td>"
          table += "<td>"+error.aya_id+"</td></t>"
        })
        table += "</table>"
        $(table).insertAfter($(this))
        $(".page_pointer").click(function(){
          page_select.val($(this).text()).change()
        })
      }
      $(this).hide()
      alert(errors.length + " errors detected")
    }
  })

  $("#save_highlights").click(function(){
    console.log("Now saving highlights")
  })

  read_cookie()
})