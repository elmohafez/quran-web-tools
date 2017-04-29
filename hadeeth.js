var pageLayout
var hadeethLayout
var datatable
var datatable_tools
var message_element
var sanad_element
var matn_element
var audio_url_element
var book_text = {}
var audio_source
var player
var audio_path
var cues
var book_name
var book_list = {
  'muslem': {display: 'صحيح مسلم', path: 'muslem_new_method'},
  'bukhari': {display: 'صحيح البخاري', path: 'bukhari_new_method'}
}

$(document).ready(function(){
  message_element = $("#hadeeth_details .message")
  sanad_element = $("#hadeeth_details .sanad span")
  matn_element = $("#hadeeth_details .matn span")
  audio_url_element = $("#audio_url")
  setup_layout()
  setup_book_list(book_list)
  setup_datatable()
  empty_article_details()
  setup_player()  
})

function setup_layout()
{
  pageLayout = $('body').layout({
    applyDefaultStyles: true,
    east__size: "20%",
    east__minSize: "10%",
    east__maxSize: "50%",
    east__onresize: function() {
      datatable.columns.adjust()
    },
    east__onclose: function() {
      datatable.columns.adjust()
    }
  });
  
  hadeethLayout = $("#hadeeth_area").layout({
    applyDefaultStyles: true,
    // north__spacing_open: 0,
    south__size: "50%",
    south__minSize: "25%",
    south__maxSize: "75%",
    center__onresize: function() {
      setup_datatable()
    }
  });

  window.onresize = function(){
    datatable.columns.adjust()
  }
}

function setup_book_list(book_list)
{
  $("#book_list").append(
    $($.map(book_list, function(book, book_name){
      return "<h3 book_name='"+book_name+"'>"+book.display+"</h3><div></div>"
    }).join("\n"))
  )
  .accordion({
    collapsible: true,
    active: false,
    heightStyle: "fill",
    beforeActivate: function(event, ui) {
      if (ui.newPanel.length > 0) { // activating
        book_name = ui.newHeader.attr("book_name")
        $("#jstree").remove().appendTo(ui.newPanel)
        get_book_data(book_name)
      }
    }
  })
}

function setup_jstree(data)
{
  $.jstree.defaults.core.multiple = false
  // data may have missing text, in which case parent should go into text, with parent replaced by #
  $.each(data, function(index, info){
    if (info.text == "") {
      info.text = info.parent
      info.parent = "#"
    }
  })
  $('#jstree')
  .on('select_node.jstree', function (e, data) {
    stop_player()
    if (data.node.children.length == 0) {
      // update table
      audio_path = data.node.parents.reverse()
      audio_path.splice(0, 1)
      var node_id = data.node.id.trim()
      audio_path.push(node_id)
      audio_path = audio_path.join("/")
      setup_datatable(node_id)
      set_details("اختر حديثا من الجدول لعرض تفاصيله")
    }
    else {
      // empty table
      setup_datatable(null)
      set_details("اختر مستوى طرفيا في الشجرة لعرض الأحاديث")
    }
  })
  .jstree({
    "plugins": ["wholerow"],
    'core': {
      'data': data
    }
  })
}

function get_book_data(book_name)
{
  load_js_data("HadeethBooks/" + book_name + "-sections.js")
  load_js_data("HadeethBooks/" + book_name + "-text.js")
  load_js_data("HadeethBooks/" + book_name + "-cues.js")
}

function load_book_text(data)
{
  book_text = data
}

function setup_datatable(selected_node)
{
  // TODO: CALCULATE THIS MAGIC NUMBER (excess) ACCORDING TO ACTUAL HEIGHT OF FILTER+TOOLBAR CONTROLS
  var excess = 43
  var height = hadeethLayout.state.center.innerHeight - excess
  var include_exclude_action = function( nButton, oConfig ) {
            var data = datatable_tools.fnGetSelectedData()
            if (data.length == 0)
              alert("Nothing selected")
            else
              alert("Including rows: \n" + data.join("\n"))
          }

  datatable = $('#hadeeth_table').DataTable({
    "scrollY": height,
    //"scrollCollapse": true,
    "scrollX": false,
    "destroy": true,  // destroy first if reinitializing
    "paging": false,
    "searching": false,
    "dom": 'tT',
    "data": selected_node ? book_text[selected_node] : [["", "", ""]],
    "columnDefs": [
      {
        "targets": [0],
        "width": "50px"
      },
      {
        "targets": [1],
        "width": "40%"
      }
    ],
    tableTools: {
      "sRowSelect": "single",
      "aButtons": [],
      "fnRowSelected": function(nodes) {
        var data = datatable_tools.fnGetSelectedData()[0]
        empty_article_details()
        set_details(null, data[1], data[2], data[0])
      },
      "fnRowDeselected": function ( nodes ) {
        empty_article_details()
        stop_player()
      }
    }
  });
  datatable_tools = TableTools.fnGetInstance('hadeeth_table');
}

function empty_article_details()
{
  set_details("لا توجد أحاديث مختارة")
  selected_article_ids = []
}

function render_article_details(article_data)
{
  set_details(null, article_data[1], article_data[2])
}

function set_details(message, sanad, matn, article_id)
{
  message_element.html(message)
  sanad_element.html(sanad)
  matn_element.html(matn)
  message ? message_element.show() : message_element.hide();
  sanad ? sanad_element.parent().show() : sanad_element.parent().hide();
  matn ? matn_element.parent().show() : matn_element.parent().hide();

  if (matn) {
    var url = "http://hadeeth.elmohafez.com/books/"+book_list[book_name].path+"/"+audio_path+"/"+article_id+".mp3"
    audio_url_element.html(url)
    audio_source.attr("src", url).appendTo(audio_source.parent())
    $(player).data("cue", cues[article_id])
    player.load()
  }
}

function setup_player()
{
  audio_source = $("#player>source")
  player = audio_source.parent()
  player = player.get(0)
  player.autoplay = true
  $(player).bind("play", function(){
    this.currentTime = $(this).data("cue")
  })
}

function process_book_cues(raw_cues)
{
  cues = {}
  $.each(raw_cues, function(id, row){
    var cols = row.split("\t")
    var article_id = cols[0].split("_")[2]
    var cue = cols[1]
    cues[article_id] = parseFloat(cue)
  })
}

function stop_player()
{
  try {
    player.pause()
    player.currentTime = 0
  } catch(e) {}
}
