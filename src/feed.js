"use strict";

const { renderMeeting } = require('./html')

module.exports = {
  renderFeed,
}

const BASE_URL = 'https://orgorgorgorgorg.org/'

async function renderFeed(grist) {
  const meetings = await Promise.all(
    grist.meetings.slice(0, 10).map(renderMeeting(grist)))

  return JSON.stringify({
    "version": "https://jsonfeed.org/version/1.1",
    "title": "The Organization Research Group",
    "home_page_url": BASE_URL,
    "feed_url": `${BASE_URL}feed.json`,
    "items": meetings.map(meeting => {
      return {
        id: meeting.id,
        url: `${BASE_URL}archive.html#${meeting.id}`,
        content_html: meeting.outerHTML,
        date_modified: new Date().toISOString(),
      }
    })
  }, null, '  ')
}
