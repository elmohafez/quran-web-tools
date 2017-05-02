$(document).ready(function(){
  var page_select = $("#page")
  var text_container = $("#glyph_text")
  var color_sel = null
  var color_chooser = $("#color_chooser")
  var color_count = 6
  var color_chooser_classnames = ""
  var current_highlight = null
  var db = new QuranHighlightsStore()
  var undo_stack = []

  // init page numbers select
  var options = ""
  for(var i = 1; i <= 604; i++)
    options += "<option value='"+i+"'>"+i+"</option>"
  page_select.empty().append(options)

  // attach events to prev/next page
  $("#prev_page").bind("mousedown", function(){
    var page = parseInt(page_select.val())
    if (page > 1)
      page_select.val(page - 1).change()
  })
  $("#next_page").bind("mousedown", function(){
    var page = parseInt(page_select.val())
    if (page < 604)
      page_select.val(page + 1).change()
  })

  // reload last location or start from page 1
  var save_last_page = function(page_id)
  {
    localStorage.setItem('page_id', page_id);
  }

  var load_last_page = function()
  {
    var page_id = localStorage.getItem('page_id') || 1;
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
    return db.select_highlights_count().then(function(count){
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

  var toggle_undo_button = function()
  {
    if (undo_stack.length == 0)
      $("#undo_highlights").hide()
    else
      $("#undo_highlights").show()
  }

  // render page
  page_select.change(function(){
    var page_id = $(this).val()
    text_container.empty()
    current_highlight = null
    undo_stack.length = 0
    toggle_undo_button()

    $.each(extract_glyphs(page_id), function(info_id, info){
      var sura_name = suras[parseInt(info.sura_id) - 1]
      var h3 = "<h3>سورة " + sura_name + " - الآية " + info.aya_id + "</h3>"
      var div = $(mode == 'highlight' ? render_highlight(page_id, info) : render_glyph_matching(page_id, info))
      text_container.append(h3)
      text_container.append(div)
      if (mode == 'highlight') {
        // add delete link
        var del_link = $("<a style='cursor: pointer'>[مسح التظليل]</a>")
        del_link.bind("mousedown", function(){
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

    var span_hover = function(span, is_touch)
    {
      // return if hovering a persisted span
      if (span.data("persist")) return

      // if original event is mouse: give span color (either highlighting or hovering)
      // if hovering, the mouseout will remove the color
      // if the event is touch: only color when highlighting the same verse
      if (!is_touch)
        span.addClass("color_chooser_c" + color_sel)

      // persist span if highlight has started and within same verse
      if (current_highlight && same_verse(span.parent().data("info"), current_highlight.info)) {
        current_highlight.glyph_ids.push(parseInt(span.attr("glyph_id")))
        span.data("persist", color_sel)
        span.addClass("color_chooser_c" + color_sel)
      }
    }

    var end_highlight = function()
    {
      if (!current_highlight) return
      // spans may have not been selected in order (e.g multiline)
      // to add some ugly code, we need to specify a comparator for Array.sort
      // just to convince it that we are sorting numbers not objects :(
      current_highlight.glyph_ids.sort(function(a,b){return a - b})
      // check that the sorted array has no gaps
      if (!no_gaps(current_highlight.glyph_ids)) {
        undo_highlight(current_highlight)
        current_highlight = null
        // yield execution so that color removal happens before the alert
        setTimeout(function(){alert("يجب تظليل كلمات متصلة وعدم ترك فراغات")}, 0)
        return
      }
      // cloning current_highlight as it must be nulled immediately
      // to prevent calling this function repeatedly
      // but it is needed to push on the undo stack after inserting 
      // in the db and gettings its primary key
      var current_highlight_clone = $.extend(true, {}, current_highlight)
      var start_glyph_id = current_highlight.glyph_ids[0],
          end_glyph_id = current_highlight.glyph_ids.pop(),
          highlight = {
            page_id: current_highlight.page_id,
            sura_id: current_highlight.info.sura_id,
            aya_id: current_highlight.info.aya_id,
            start_glyph_id: start_glyph_id,
            end_glyph_id: end_glyph_id,
            color: current_highlight.color
          }
      db.insert_highlight(highlight)
      .then(function(highlight_id){
        current_highlight_clone.id = highlight_id
        undo_stack.push(current_highlight_clone)
        toggle_undo_button()
      })
      .then(update_total_highlights_count)
      current_highlight = null
    }

    var no_gaps = function(array)
    {
      // check if a given numeric array has no gaps (must be sorted ascendingly)
      for (var i = 0; i < array.length - 1; i++) {
        if (array[i+1] - array[i] > 1)
          return false
      }
      return true
    }

    // highlight specific events
    if (mode == 'highlight') {
      $("span:first", color_chooser).mousedown()
      $("span.glyph")
      .bind("mouseover", function(e){
        var span = $(this)
        span_hover(span, false)
      })
      .bind("touchmove", function(e)
      {
        // the event target will always point to the element at which the touch
        // was originally triggered (i.e touchstart), not the one that is currently behind the pointer
        var touch = e.originalEvent.touches[0]
        var el = $(document.elementFromPoint(touch.clientX, touch.clientY))
        if (el.hasClass('glyph')) span_hover(el, true)
      })
      .bind("mouseout", function(){
        if (!$(this).data("persist"))
          $(this).removeClass("color_chooser_c" + color_sel)
      })
      .bind("mousedown touchstart", function(e){
        e.preventDefault()  // handle either mouse or touch, but not both!
        var span = $(this), div = span.parent()
        current_highlight = {
          div: div,
          info: div.data("info"),
          glyph_ids: [parseInt(span.attr("glyph_id"))],
          color: color_sel,
          page_id: page_id
        }
        span_hover(span, false)
      })
      .bind("mouseup touchend", function(e){
        e.preventDefault()  // handle either mouse or touch, but not both!
        end_highlight()
      })
  
      load_highlights(page_id)

      // bind mouseup on document to handle the case
      // where user ends the highlighting while outside the glyph spans
      $(document).bind("mouseup", end_highlight)
    }

    save_last_page(page_id)
  })

  // create color chooser
  for(var c = 0; c < color_count; c++){
    color_chooser.append("<span color_id='"+c+"' class='color_chooser_c"+c+"'></span>")
    color_chooser_classnames += " color_chooser_c" + c
  }
  $("span", color_chooser).bind("mousedown touchstart", function(e){
    e.preventDefault()
    // unselect previous selected
    $("span", color_chooser).removeClass("color_sel")
    // select new span
    var span = $(this)
    color_sel = span.attr("color_id")
    span.addClass("color_sel")
  })

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

  var download = function(filename, text) {
    var element = document.createElement('a');
    element.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', filename);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  }

  $("#download_highlights").bind("mousedown", function(){
    db.select_all_highlights()
    .then(function(highlights){
      var blob = [
        "page_id",
        "sura_id",
        "aya_id",
        "start_glyph_id",
        "end_glyph_id",
        "color"
      ].join(",") + "\n" +
      $.map(highlights, function(highlight){
        return [
          highlight.page_id,
          highlight.sura_id,
          highlight.aya_id,
          highlight.start_glyph_id,
          highlight.end_glyph_id,
          highlight.color
        ].join(",")
      }).join("\n")
      download("quran-highlights.csv", blob)
    })
  })

  var undo_highlight = function(highlight)
  {
    // undoes a given highlight by removing its color and persist state
    for (var i = 0; i < highlight.glyph_ids.length; i++) {
      $("span.glyph[glyph_id='" + highlight.glyph_ids[i] + "']", highlight.div)
        .removeData("persist")
        .removeClass(color_chooser_classnames)
    }
  }

  $("#undo_highlights").bind("mousedown", function(){
    if (undo_stack.length == 0) return
    var highlight = undo_stack.pop()
    db.delete_highlight(highlight.id)
    .then(function(){
      undo_highlight(highlight)
      toggle_undo_button()
    })
  })

  load_last_page()
})