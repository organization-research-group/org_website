#!/usr/bin/env python3

import os
import re
import sys
import time
from datetime import datetime

from clean_ttl import clean_ttl

meeting_ttl_template = '''
:meeting:{date}
    a :Meeting ;
    lode:atTime [
        a owltime:Interval ;
        owltime:hasBeginning [
            a owltime:Instant ;
            owltime:inXSDDateTimeStamp {date}T11:00:00-0{offset}00
        ]
    ]'''
    
involved_ttl_template = ''' ;
    lode:involved {readings}'''

reading_ttl_template = '''
{key}
    # FIXME: Update the details of this entry.
    # Added automatically for meeting on {date}
    a :Reading .
'''

BIB_FILENAME = os.path.join(
    os.path.dirname(os.path.realpath(__file__)),
    '..',
    'bib.ttl'
)

print()

try:
    while True:
        date_input = input('\033[1mDate\033[0m (yyyy-mm-dd)\n\n-> ').strip()

        try:
            date = datetime.strptime(date_input, '%Y-%m-%d')
        except ValueError:
            print('\nWrong date format, try again\n')
            continue

        cites_input = input('''
\033[1mReadings involved\033[0m
Cite items with an identifier consisting of the first word of the first
author's family name followed by the year, like Buckland1994 or Suchman1995.
Join multiple readings with commas.

-> ''')

        cites = [
            ':reading:' + cite.strip()
            for cite in cites_input.split(',')
        ] if cites_input.strip() else []

        old_ttl = ''.join([l for l in open(BIB_FILENAME)])

        pattern = re.compile('    :meetings \[')

        new_ttl = ''

        new_ttl += meeting_ttl_template.format(
            date=date_input,
            offset=4 if date.timetuple().tm_isdst > 0 else 5)

        if cites:
            new_ttl += involved_ttl_template.format(readings=', '.join(cites))

        new_ttl += ' .\n'

        for cite in cites:
            new_ttl += reading_ttl_template.format(
                key=cite,
                date=date_input)
            new_ttl += '\n'

        print('\n====')
        print(new_ttl + '====\n')

        keep = input('\033[1mAdding these statements to bib.ttl. Press Ctrl-c to cancel.\033[0m')

        ttl_with_new = clean_ttl(
            old_ttl.replace(
                '    :meeting ',
                '    :meeting :meeting:' + date_input + ', ')
            + new_ttl
        )

        with open(BIB_FILENAME, 'w') as fp:
            fp.write(ttl_with_new)


except (EOFError, KeyboardInterrupt):
    print('')
    sys.exit(0)
