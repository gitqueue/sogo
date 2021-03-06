/* -*- Mode: javascript; indent-tabs-mode: nil; c-basic-offset: 2 -*- */
/* JavaScript for SOGo.SchedulerUI module */

(function() {
  'use strict';

  angular.module('SOGo.SchedulerUI', ['ngSanitize', 'ui.router', 'SOGo.Common', 'SOGo.PreferencesUI', 'SOGo.ContactsUI', 'SOGo.MailerUI'])
    .config(configure)
    .run(runBlock);

  /**
   * @ngInject
   */
  configure.$inject = ['$stateProvider', '$urlRouterProvider'];
  function configure($stateProvider, $urlRouterProvider) {
    $stateProvider
      .state('calendars', {
        url: '/calendar',
        views: {
          calendars: {
            templateUrl: 'UIxCalMainFrame', // UI/Templates/SchedulerUI/UIxCalMainFrame.wox
            controller: 'CalendarsController',
            controllerAs: 'calendars'
          }
        },
        resolve: {
          stateCalendars: stateCalendars
        }
      })
      .state('calendars.view', {
        url: '/{view:(?:day|week|month)}/:day',
        sticky: true,
        deepStateRedirect: true,
        views: {
          calendarView: {
            templateUrl: function($stateParams) {
              // UI/Templates/SchedulerUI/UIxCalDayView.wox or
              // UI/Templates/SchedulerUI/UIxCalWeekView.wox or
              // UI/Templates/SchedulerUI/UIxCalMonthView.wox
              return $stateParams.view + 'view?day=' + $stateParams.day;
            },
            controller: 'CalendarController',
            controllerAs: 'calendar'
          }
        },
        resolve: {
          stateEventsBlocks: stateEventsBlocks
        }
      });

    $urlRouterProvider.when('/calendar/day', function() {
      // If no date is specified, show today
      var now = new Date();
      return '/calendar/day/' + now.getDayString();
    });
    $urlRouterProvider.when('/calendar/week', function() {
      // If no date is specified, show today's week
      var now = new Date();
      return '/calendar/week/' + now.getDayString();
    });
    $urlRouterProvider.when('/calendar/month', function() {
      // If no date is specified, show today's month
      var now = new Date();
      return '/calendar/month/' + now.getDayString();
    });

    // If none of the above states are matched, use this as the fallback.
    // runBlock will also act as a fallback by looking at user's settings
    $urlRouterProvider.otherwise('/calendar');
  }

  /**
   * @ngInject
   */
  stateCalendars.$inject = ['Calendar'];
  function stateCalendars(Calendar) {
    return Calendar.$calendars || Calendar.$findAll(window.calendarsData);
  }

  /**
   * @ngInject
   */
  stateEventsBlocks.$inject = ['$stateParams', 'Component'];
  function stateEventsBlocks($stateParams, Component) {
    return Component.$eventsBlocksForView($stateParams.view, $stateParams.day.asDate());
  }

  /**
   * @ngInject
   */
  runBlock.$inject = ['$rootScope', '$location', 'Preferences'];
  function runBlock($rootScope, $location, Preferences) {
    $rootScope.$on('$routeChangeError', function(event, current, previous, rejection) {
      console.error(event, current, previous, rejection);
    });
    if ($location.url().length === 0) {
      // Restore user's last view
      Preferences.ready().then(function() {
        var view = /(.+)view/.exec(Preferences.settings.Calendar.View);
        if (view) {
          $location.replace().url('/calendar/' + view[1]);
        }
      });
    }
  }

})();
