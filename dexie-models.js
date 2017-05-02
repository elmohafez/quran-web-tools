var QuranHighlightsStore = function()
{
  // to delete whole db: indexedDB.deleteDatabase("quran_highlights")
  var db = new Dexie("quran_highlights");
  db.version(1).stores({
    highlights: '++id,page_id,sura_aya_ids'
  })

  this.insert_highlight = function(params) {
    params.sura_aya_ids = params.sura_id + "-" + params.aya_id
    return db.highlights.add(params)
  }

  this.delete_highlights = function(sura_id, aya_id) {
    return db.highlights.where("sura_aya_ids").equals(sura_id + "-" + aya_id).delete()
  }

  this.delete_highlight = function(id) {
    return db.highlights.where("id").equals(id).delete()
  }

  this.select_highlights = function(page_id) {
    return db.highlights.where("page_id").equals(page_id)
  }

  this.select_highlights_count = function() {
    return db.highlights.count()
  }

  this.select_all_highlights = function() {
    return db.highlights.toArray()
  }
}