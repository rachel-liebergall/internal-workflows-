/**
 * NTN Deck Builder — Apps Script web app called by the create-speaker-deck-baxter routine.
 *
 * Builds a populated deck from the official NTN Google Slides template: copies the template into
 * the event's Drive folder, duplicates the requested template slides in order, fills their text
 * boxes and speaker notes, then removes the untouched template slides.
 *
 * Deploy: Execute as "Me", Who has access "Anyone". Every request must carry the shared secret
 * (run setup() once to create it). The script only ever reads the template and writes the new copy,
 * and only into folders inside the company file repository.
 *
 * Actions (POST JSON):
 *   {"secret": "...", "action": "catalog"}
 *     → {ok, slides: [{slide: 1, elements: [{index: 0, text: "Main Title."}, ...]}, ...]}
 *   {"secret": "...", "action": "build", "folderId": "...", "title": "...",
 *    "slides": [{"templateSlide": 3, "text": {"0": "New title", "2": ""}, "notes": "..."}, ...]}
 *     → {ok, fileId, url, slideCount, report: [...]}
 *   `text` keys are element indexes from the catalog; "" clears a box.
 */

const TEMPLATE_ID = '1qkcB4aOvxVT7fRtFwgYyHMakbGbbfm-a4itnx9dfkpk'; // NTN Google Slides General Template
const ALLOWED_ROOTS = [
  '1qjOrXnC2m3RHqrz_7vQs3HD_LBCQSRGZ', // Now to Next Company File Repository
  '1RERSeJYFD08Bl3ysU9U1cMPezwYPoJC7', // Upcoming Speaker Events
];
const PLACEHOLDER = /fill in|^heading$|^subheading|^title\.?$|statement\.?$|month dd|^blank$|^one word$|option \d|question topic|\[dow\]|\[blank\]/i;

function setup() {
  const secret = Utilities.getUuid().replace(/-/g, '') + Utilities.getUuid().replace(/-/g, '');
  PropertiesService.getScriptProperties().setProperty('SECRET', secret);
  Logger.log('Add this to the routine environment as DECK_BUILDER_SECRET: ' + secret);
}

function doPost(e) {
  try {
    const req = JSON.parse(e.postData.contents);
    const secret = PropertiesService.getScriptProperties().getProperty('SECRET');
    if (!secret || req.secret !== secret) return json_({ ok: false, error: 'unauthorized' });
    if (req.action === 'catalog') return json_({ ok: true, slides: catalog_(SlidesApp.openById(TEMPLATE_ID)) });
    if (req.action === 'build') return json_(build_(req));
    return json_({ ok: false, error: 'unknown action' });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

function catalog_(pres) {
  return pres.getSlides().map((slide, i) => ({
    slide: i + 1,
    elements: textElements_(slide)
      .map((el, index) => ({ index: index, text: el.getText().asString().trim() }))
      .filter((el) => el.text),
  }));
}

function build_(req) {
  if (!req.folderId || !req.title || !Array.isArray(req.slides) || !req.slides.length) {
    return { ok: false, error: 'folderId, title and slides are required' };
  }
  const folder = DriveApp.getFolderById(req.folderId);
  if (!isAllowed_(folder)) return { ok: false, error: 'folder is outside the company file repository' };

  const copy = DriveApp.getFileById(TEMPLATE_ID).makeCopy(req.title, folder);
  const pres = SlidesApp.openById(copy.getId());
  const originals = pres.getSlides();
  const report = [];

  req.slides.forEach((spec, n) => {
    const src = originals[spec.templateSlide - 1];
    if (!src) {
      report.push({ slide: n + 1, error: 'no template slide ' + spec.templateSlide });
      return;
    }
    const slide = src.duplicate();
    slide.move(pres.getSlides().length - 1);
    const els = textElements_(slide);
    Object.keys(spec.text || {}).forEach((key) => {
      const el = els[Number(key)];
      if (el) el.getText().setText(spec.text[key]);
      else report.push({ slide: n + 1, error: 'no text element ' + key });
    });
    if (spec.notes) slide.getNotesPage().getSpeakerNotesShape().getText().setText(spec.notes);
    const leftover = els.map((el) => el.getText().asString().trim()).filter((t) => t && PLACEHOLDER.test(t));
    if (leftover.length) report.push({ slide: n + 1, leftoverPlaceholders: leftover });
  });

  originals.forEach((slide) => slide.remove());
  pres.saveAndClose();
  return {
    ok: true,
    fileId: copy.getId(),
    url: 'https://docs.google.com/presentation/d/' + copy.getId() + '/edit',
    slideCount: req.slides.length,
    report: report,
  };
}

// Every text-bearing element on a slide, in a stable order (groups flattened, table cells included).
function textElements_(slide) {
  const out = [];
  const walk = (el) => {
    const type = el.getPageElementType();
    if (type === SlidesApp.PageElementType.GROUP) {
      el.asGroup().getChildren().forEach(walk);
    } else if (type === SlidesApp.PageElementType.SHAPE) {
      out.push(el.asShape());
    } else if (type === SlidesApp.PageElementType.TABLE) {
      const table = el.asTable();
      for (let r = 0; r < table.getNumRows(); r++) {
        for (let c = 0; c < table.getNumColumns(); c++) {
          const cell = table.getCell(r, c);
          if (cell.getMergeState() !== SlidesApp.CellMergeState.MERGED) out.push(cell);
        }
      }
    }
  };
  slide.getPageElements().forEach(walk);
  return out;
}

function isAllowed_(folder) {
  let level = [folder];
  for (let depth = 0; depth < 12 && level.length; depth++) {
    const next = [];
    for (const f of level) {
      if (ALLOWED_ROOTS.indexOf(f.getId()) !== -1) return true;
      const parents = f.getParents();
      while (parents.hasNext()) next.push(parents.next());
    }
    level = next;
  }
  return false;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
