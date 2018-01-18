#!/usr/bin/env python3

import os
import re
import sys
import time

templates = {
    'document': open('./templates/document.html').read(),

    'index': open('./templates/index.html').read(),
    'archive': open('./templates/archive.html').read(),
}

header_pattern = re.compile('^(\d{4}-\d{2}-\d{2})$\n---\n', re.M)
doi_pattern = re.compile(' doi:([^ ]+)$')


def format_date(date_str):
    time_struct = time.strptime(date_str, '%Y-%m-%d')
    return time.strftime('%A, %b. %e, %Y', time_struct)


def format_reading(reading):
    reading = re.sub('\n+', '\n', reading.rstrip())
    readings = reading.split('\n')

    readings = [
        re.sub("'([^']+)'", r'&lsquo;\1&rsquo;', r)
        for r in readings
    ]

    readings = [
        re.sub('"([^"]+)"', r'&ldquo;\1&rdquo;', r)
        for r in readings
    ]

    readings = [
        re.sub(doi_pattern, r' <a href="https://doi.org/\1">doi:\1</a>', r)
        for r in readings
    ]

    readings = [
        '<li>' + r + '</li>'
        for r in readings
    ]

    return '<ul>' + '\n'.join(readings) + '</ul>'


def parse_readings(filename):
    fp = open(filename, 'r')
    readings = iter(re.split(header_pattern, fp.read()))
    next(readings)  # Skip blank line

    entries = [
        {
            "date": format_date(date),
            "reading": format_reading(reading)
        }

        for (date, reading) in zip(readings, readings)
    ]

    fp.close()

    return entries


def reading_to_html(reading, level=3):
    return """
        <div class="reading">
          <h{level}>{heading}</h{level}>
          <div>{content}</div>
        </div>
    """.format(
        level=level,
        heading=reading['date'],
        content=reading['reading'],
    )

if __name__ == '__main__':
    current_readings = parse_readings('./readings.md')

    current_reading = current_readings[0]
    recent_readings = current_readings[1:4]

    if 'archive' in sys.argv:
        content = templates['archive'].format(
            recent_readings='\n'.join(map(reading_to_html, current_readings)),
            last_updated=format_date(time.strftime('%Y-%m-%d'))
        )
    else:
        content = templates['index'].format(
            current_reading=reading_to_html(current_reading),
            recent_readings='\n'.join(map(
                reading_to_html, recent_readings)),
            last_updated=format_date(time.strftime('%Y-%m-%d'))
        )

    print(templates['document'].format(content=content))
