/*
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const {html} = require('common-tags');
const slugify = require('slugify');

const AuthorsDate = require('./AuthorsDate');

/**
 * @param {!Array<{title: string, from: !Date, sessions: !Array<any>}>} days
 * @param {Object.<string, Author>} authorsCollection
 * @return {string}
 */
module.exports = (days, authorsCollection) => {
  // Find the default day to show, as a very basic non-JS fallback. Pick the
  // first day where the build time is before the end time of the sessions.
  // This isn't a very good fallback as our build happens at minimum of once per
  // day, but it's better than nothing.
  const now = new Date();
  let defaultScheduleDay = 0;
  for (let i = 0; i < days.length; ++i) {
    const {date, duration} = days[i];
    const endTime = new Date(date);
    endTime.setHours(endTime.getHours() + duration);

    if (now < endTime) {
      defaultScheduleDay = i;
      break;
    }
  }

  const slugs = {};
  const slugForTitle = (title) => {
    // Find a slug for this title, but prevent duplicate IDs.
    const base = slugify(title, {
      lower: true,
      strict: true,
      remove: /[^-\w _]/, // remove anything not in: basic word chars, space, - and _
    });
    let id = base;
    let suffix = 0;
    while (id in slugs) {
      id = base + ++suffix;
    }
    slugs[id] = title;
    return id;
  };

  const renderSession = ({speaker, title, abstract}) => {
    // Always pass an Array of author IDs.
    const authors = typeof speaker === 'string' ? [speaker] : speaker;

    const id = slugForTitle(title);

    // Coerce to array or empty array.
    abstract =
      (abstract && (typeof abstract === 'string' ? [abstract] : abstract)) ||
      [];

    return html`
      <div class="w-event-schedule__row" data-session-id=${id}>
        <div class="w-event-schedule__cell w-event-schedule__speaker">
          ${AuthorsDate({authors}, authorsCollection)}
        </div>
        <div class="w-event-schedule__cell w-event-schedule__session">
          <a class="w-event-schedule__open" href="#${id}">
            <span>${title}</span>
          </a>
          <div class="w-event-schedule__abstract" hidden>
            ${abstract.map((part) => html`<p>${part}</p>`)}
          </div>
        </div>
      </div>
    `;
  };

  const renderDay = (day, index) => {
    // nb. We don't render a fallback time for browsers without JS.
    return html`
      <div
        data-label="${day.title}"
        class="${index === defaultScheduleDay ? 'w-tabs-default' : ''}"
      >
        <div class="w-event-section__schedule_header">
          <web-event-time
            class="unresolved"
            datetime="${day.date.toISOString()}"
            duration="${day.duration}"
          ></web-event-time>
        </div>

        <div class="w-event-schedule">
          ${day.sessions.map(renderSession)}
        </div>
      </div>
    `;
  };

  return html`
    <web-event-schedule>
      <web-tabs class="w-event-tabs unresolved" label="schedule">
        ${days.map(renderDay)}
      </web-tabs>
    </web-event-schedule>
  `;
};
