#!/usr/bin/env python3.5

import cgi
import datetime
import html

from pathlib import Path

import cgitb
cgitb.enable()


def get_current_time_path():
    path = Path('{d.year}-{d.month}'.format(d=datetime.datetime.now()))
    if not path.exists():
        path.mkdir()
    return path


def get_existing_readings():
    base_path = get_current_time_path()
    readings = base_path.glob('*.txt')
    return [reading.read_text().split('\n', 2) for reading in readings]


def write_form_readings(form):
    base_path = get_current_time_path()

    data = list(zip(*[
        map(html.escape, form.getlist(field))
        for field in ('submitted', 'submitter', 'title', 'delete',)
    ]))


    for i, (submitted, submitter, reading, delete) in enumerate(data, 1):
        filepath = base_path / '{}.txt'.format(submitter)

        if submitted == 'new':
            submitted = datetime.datetime.now().timestamp()

        if delete == 'on':
            if filepath.exists():
                filepath.unlink()

	if not submitter or not reading:
            continue

        else:
            filepath.write_text('{}\n{}\n{}'.format(
                submitted,
                submitter,
                reading
            ).strip())


def item_to_form(i=0, item=None):
    if item is None:
        item = ['new', '', '']
        delete_checkbox = '<input type="hidden" name="delete" value="fake" />'
    else:
        delete_checkbox = '<label>Delete? <input name="delete" type="checkbox" /></label>'

    submitted, submitter, title = item

    return '''
    <div>
        <input type="hidden" name="submitted" value="{submitted}" />

        <p>
            <label for="submitter_{i}">Submitter</label>
            <br />
            <input
                type="text"
                name="submitter"
                value="{submitter}"
                id="submitter_{i}" />
        </p>

        <p>
            <label for="title_{i}">Title</label>
            <br />
            <textarea
                name="title"
                id="title_{i}"
                rows="3"
                cols="120"
            >{title}</textarea>
        </p>

        <p>
            {delete_checkbox}
        </p>
    </div>
    '''.format(
        i=i,
        submitted=submitted,
        submitter=submitter,
        title=title,
        delete_checkbox=delete_checkbox
    )


if __name__ == '__main__':
    form = cgi.FieldStorage(keep_blank_values=True)

    print('Content-Type: text/html')
    print()

    write_form_readings(form)

    existing_readings = get_existing_readings()
    existing_readings = '<hr />'.join([
        item_to_form(i, item)
        for i, item in enumerate(existing_readings)
    ])
    
    print('''
    <h1>Bulletin board for {}</h1>

    <form method="post">

    <h2>Add item</h2>
    {}

    <h2>Existing items</h2>
    {}

    <hr />

    <button type="submit">Submit</button>
    </form>
    '''.format(
        get_current_time_path(),
        item_to_form(),
        existing_readings
    ))
