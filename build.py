#!/usr/bin/env python3

import os
import re
import sys
import time

readings = sorted(os.listdir('readings'), reverse=True)

current_reading = readings[0]
recent_readings = readings[1:6]

def datestring_from_filename(filename):
    time_struct = time.strptime(filename.replace('.html', ''), '%Y-%m-%d')
    return time.strftime('%A, %b. %e, %Y', time_struct)

def content_from_filename(filename):
    text = open(os.path.join('readings', filename), 'r').read()
    text = re.sub(
        r'(doi:([^\b<]+))',
        r'<a href="https://doi.org/\2">\1</a>',
        text)
    return text


def entry_from_filename(filename, level=3):
    return """
        <div class="reading">
          <h{level}>{heading}</h{level}>
          <div>{content}</div>
        </div>
    """.format(
        level=level,
        heading=datestring_from_filename(filename),
        content=content_from_filename(filename)
    )

template = """
<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <link rel="stylesheet" href="style.css">
  <title>The Organization Research Group</title>
</head>

<body>
  <div class="flex">
  <main>
  {content}
  </main>
  </div>

  <script type="text/javascript" src="org.js"></script>
</body>

</html>
"""

archive_template = """
  <section>
    <h1><a href="./">The Organization Research Group</a></h1>
  </section>
  <section>
    <h2>Past meetings</h2>
    {recent_readings}
  </section>
  <section>
    <p>
      <i>Last updated {last_updated}</i>
    </p>
  </section>
"""

index_template = """
  <section id="about">
    <h1>The Organization Research Group</h1>

    <p>
    ORG meets Fridays at 11am in 214 Manning Hall.
    </p>
    <p>
    <a href="mailto:listmanager@listserv.unc.edu?body=subscribe%20org">Subscribe</a>
    to our email list for announcements and general discussion.
    </p>
  </section>

  <section id="current">
    <h2>Current meeting</h2>
    {current_reading}
  </section>

  <section id="recent">
    <h2 id="recent">Recent meetings</h2>
    {recent_readings}
  </section>

  <section>
    <p>
      <a href="archive.html">All past meetings</a>
    </p>
    <p>
      <i>Last updated {last_updated}</i>
    </p>
  </section>
"""


if __name__ == '__main__':
    if 'archive' in sys.argv:
        content = archive_template.format(
            recent_readings='\n'.join(map(entry_from_filename, readings)),
            last_updated=datestring_from_filename(time.strftime('%Y-%m-%d'))
        )
    else:
        content = index_template.format(
            current_reading=entry_from_filename(current_reading),
            recent_readings='\n'.join(map(
                entry_from_filename, recent_readings)),
            last_updated=datestring_from_filename(time.strftime('%Y-%m-%d'))
        )

    print(template.format(content=content))
