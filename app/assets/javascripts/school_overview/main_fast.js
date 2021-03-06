//= require ./school_overview_page

$(function() {
  if ($('body').hasClass('schools') && $('body').hasClass('show_fast')) {
    var MixpanelUtils = window.shared.MixpanelUtils;
    var SchoolOverviewPage = window.shared.SchoolOverviewPage;
    var Filters = window.shared.Filters;
    var createEl = window.shared.ReactHelpers.createEl;

    function main() {
      var serializedData = $('#serialized-data').data();
      MixpanelUtils.registerUser(serializedData.currentEducator);
      MixpanelUtils.track('PAGE_VISIT', { page_key: 'SCHOOL_OVERVIEW_DASHBOARD_FAST' });

      renderLoading();
      requestsPromise(serializedData.schoolId)
        .then(mergedPromise)
        .then(render.bind(null, serializedData));
    }

    function requestsPromise(schoolId) {
      // make two requests, wait til they both come back
      return $.when(
        $.ajax('/schools/' + schoolId + '/get_precomputed_hashes_for_school/'),
        $.ajax('/schools/' + schoolId + '/get_mutable_fields_for_school/')
      );
    }

    function mergedPromise(precomputedReq, mutableFieldsReq) {
      var precomputedStudents = precomputedReq[0];
      var mutableFields = mutableFieldsReq[0];

      // make indexes by student_id
      /*
      [
        all_event_notes: { 34: [{}, {}], 72: [{}] },
        all_services: { 13: [{}], 22: [{}] },
        ...
      ]
      */
      var indexMap = Object.keys(mutableFields).reduce(function (indexMap, key) {
        var index =  _.groupBy(mutableFields[key], 'student_id');
        indexMap[key] = index;
        return indexMap;
      }, {});

      var merged = precomputedStudents.map(function(student) {
        return _.merge(student, {
          event_notes: indexMap.all_event_notes[student.id] || [],
          active_services: indexMap.all_active_services[student.id] || [],
          summer_services: indexMap.all_summer_services[student.id] || [],
          interventions: indexMap.all_interventions[student.id] || []
        });
      });

      return $.Deferred().resolve(merged);
    }

    function render(serializedData, students) {
      ReactDOM.render(createEl(SchoolOverviewPage, {
        allStudents: students,
        serviceTypesIndex: serializedData.constantIndexes.service_types_index,
        eventNoteTypesIndex: serializedData.constantIndexes.event_note_types_index,
        initialFilters: Filters.parseFiltersHash(window.location.hash)
      }), document.getElementById('main'));
    }

    function renderLoading() {
      document.getElementById('main').innerHTML = '<div style="padding: 40px; font-size: 24px;">Loading...</div>';
    }


    main();
  }
});
