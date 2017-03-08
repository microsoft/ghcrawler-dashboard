// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

/*** Charts - http://c3js.org/examples.html ***/
var queuedMessagesChart;
var queuedMessagesTimeRangeSec = 360;
var queuedMsgs1MinBtn = $('#queuedMsgs1MinBtn');
var queuedMsgs10MinBtn = $('#queuedMsgs10MinBtn');
var queuedMsgs60MinBtn = $('#queuedMsgs60MinBtn');
queuedMsgs1MinBtn.click(function () {
  queuedMessagesTimeRangeSec = 60;
  updateButtonsActiveClass(queuedMsgs1MinBtn, [queuedMsgs10MinBtn, queuedMsgs60MinBtn]);
  refreshChart('queuedMessages');
});
queuedMsgs10MinBtn.click(function () {
  queuedMessagesTimeRangeSec = 600;
  updateButtonsActiveClass(queuedMsgs10MinBtn, [queuedMsgs1MinBtn, queuedMsgs60MinBtn]);
  refreshChart('queuedMessages');
});
queuedMsgs60MinBtn.click(function () {
  queuedMessagesTimeRangeSec = 3600;
  updateButtonsActiveClass(queuedMsgs60MinBtn, [queuedMsgs1MinBtn, queuedMsgs10MinBtn]);
  refreshChart('queuedMessages');
});

function updateButtonsActiveClass(clickedButton, otherButtons) {
  otherButtons.forEach(function (button) {
    button.removeClass('active');
  });
  clickedButton.addClass('active');
}

$.get('/queuesData?sec=' + queuedMessagesTimeRangeSec, function (stats) {
  var columnsData = transformData(stats);
  queuedMessagesChart = c3.generate({
    bindto: '#queuedMessagesChart',
    data: {
      x: 'x',
      columns: columnsData,
      type: 'spline'
    },
    zoom: {
      enabled: true
    },
    transition: {
      duration: 0
    },
    axis: {
      x: {
        label: {
          text: 'min:sec',
          position: 'outer-center'
        },
        type: 'timeseries',
        tick: {
          count: 20,
          format: function (x) {
            return (x.getMinutes() < 10 ? '0' + x.getMinutes() : x.getMinutes()) + ':' +
              (x.getSeconds() < 10 ? '0' + x.getSeconds() : x.getSeconds());
          }
        }
      },
      y: {
        label: {
          text: 'Number of messages',
          position: 'outer-middle'
        },
        padding: { bottom: 0 }
      }
    }
  });
});

/* Samples:
FROM:
 {"time":["2016-12-22T17:16:21.291Z","2016-12-22T17:16:26.307Z"],"data":{"deadletter":[0,0],"immediate":[0,0],"later":[0,0],"normal":[9931,9931],"soon":[0,0]}}
TO:
 columns: [
   ['x', "2016-12-22T17:16:21.291Z","2016-12-22T17:16:26.307Z"],
   ['deadletter', 0, 0],
   ['normal', 9931, 9931],
   ...
 ]
 FROM:
  {"time":["2016-12-28T21:28:40Z","2016-12-28T21:28:41Z"],"data":{"deadletter:push":[0,0],"deadletter:repush":[0,0],"deadletter:done":[0,0],"deadletter:abandon":[0,0],"immediate:push":[0,0],"immediate:repush":[0,0],"immediate:done":[0,0],"immediate:abandon":[0,0],"later:push":[0,0],"later:repush":[0,0],"later:done":[0,0],"later:abandon":[0,0],"normal:push":[2,1],"normal:repush":[0,0],"normal:done":[0,0],"normal:abandon":[0,0],"soon:push":[0,0],"soon:repush":[0,0],"soon:done":[0,0],"soon:abandon":[0,0]}}
 TO:
  columns: [
    ['x', "2016-12-28T21:28:40Z","2016-12-28T21:28:41Z"],
    ['deadletter:push', 0, 0], ...
    ['normal:push', 2, 1], ...
  ]
*/
function transformData(stats) {
  var transformedData = [];
  var times = stats.time.map(function (time) {
    return new Date(time);
  });
  times.unshift('x');
  transformedData.push(times);
  Object.keys(stats.data).forEach(function (name) {
    stats.data[name].unshift(name);
    transformedData.push(stats.data[name]);
  });
  return transformedData;
}

var messageRatesChart;
var messageRatesTimeRangeSec = 60;
var messageRates1MinBtn = $('#messageRates1MinBtn');
var messageRates10MinBtn = $('#messageRates10MinBtn');
var messageRates60MinBtn = $('#messageRates60MinBtn');
messageRates1MinBtn.click(function () {
  messageRatesTimeRangeSec = 60;
  updateButtonsActiveClass(messageRates1MinBtn, [messageRates10MinBtn, messageRates60MinBtn]);
  refreshChart('messageRates');
});
messageRates10MinBtn.click(function () {
  messageRatesTimeRangeSec = 600;
  updateButtonsActiveClass(messageRates10MinBtn, [messageRates1MinBtn, messageRates60MinBtn]);
  refreshChart('messageRates');
});
messageRates60MinBtn.click(function () {
  messageRatesTimeRangeSec = 3600;
  updateButtonsActiveClass(messageRates60MinBtn, [messageRates1MinBtn, messageRates10MinBtn]);
  refreshChart('messageRates');
});

$.get('/messageRatesData?sec=' + messageRatesTimeRangeSec, function (stats) {
  var columnsData = transformData(stats);
  messageRatesChart = c3.generate({
    bindto: '#messageRatesChart',
    data: {
      x: 'x',
      columns: columnsData,
      type: 'spline'
    },
    zoom: {
      enabled: true
    },
    transition: {
      duration: 0
    },
    axis: {
      x: {
        label: {
          text: 'min:sec',
          position: 'outercenter'
        },
        type: 'timeseries',
        tick: {
          count: 20,
          format: function (x) {
            return (x.getMinutes() < 10 ? '0' + x.getMinutes() : x.getMinutes()) + ':' +
              (x.getSeconds() < 10 ? '0' + x.getSeconds() : x.getSeconds());
          }
        }
      },
      y: {
        label: {
          text: 'Messages / sec',
          position: 'outermiddle'
        },
        padding: { bottom: 0 }
      }
    }
  });
});

function refreshChart(chartName) {
  var url;
  var chart;
  if (chartName === 'queuedMessages') {
    url = '/queuesData?sec=' + queuedMessagesTimeRangeSec;
    chart = queuedMessagesChart;
  } else {
    url = '/messageRatesData?sec=' + messageRatesTimeRangeSec;
    chart = messageRatesChart;
  }
  $.get(url, function (stats) {
    var columnsData = transformData(stats);
    chart.load({
      columns: columnsData
    });
  });
}

setInterval(function () {
  refreshChart('queuedMessages');
}, 5000);

setInterval(function () {
  refreshChart('messageRates');
}, 8000);

/*** Crawler Configuration ***/
var updateConfigs = $('#updateConfigs');
var updateConfigsAlert = $('#updateConfigsAlert');
var initialUpdateConfigString = `[\n   { "op": "replace", "path": "/crawler/count", "value": 0 }\n]`;
updateConfigs.val(initialUpdateConfigString);

var crawlerUrl = $('#crawlerUrl');
var currentConfigs = $('#currentConfigs');
var refreshConfigsBtn = $('#refreshConfigsBtn');
var currentConfigsAlert = $('#currentConfigsAlert');

// crawler requests
var requests = $('#requests');
var queueRequestsAlert = $('#queueRequestsAlert');
var initialQueueRequestData = {
  type: 'org',
  url: 'https://api.github.com/orgs/contoso-d',
  policy: 'default'
};
requests.val(JSON.stringify(initialQueueRequestData, null, 2));

var recreateQueueName = $('#recreateQueueName');
var recreateQueueResponse = $('#recreateQueueResponse');
var queueAlert = $('#queueAlert');
var queueModal = $('#queueModal');

var getQueueName = $('#getQueueName');
var getCount = $('#getCount');
var requestList = $('#requestList');
var removeRequests = $('#removeRequests');
var getRequestsAlert = $('#getRequestsAlert');
var requestsModal = $('#requestsModal');
var deadletterAlert = $('#deadletterAlert');
var deleteDeadletterModal = $('#deleteDeadletterModal');
var requeueDeadletterModal = $('#requeueDeadletterModal');
var deadletterTotalCount = $('#deadletterTotalCount');
var deadletterSelectedCount = $('#deadletterSelectedCount');
var deadletterFilteredCount = $('#deadletterFilteredCount');

retrieveCrawlerConfiguration();

$('#refreshConfigsBtn').click(function () {
  retrieveCrawlerConfiguration();
});

$('#updateConfigsBtn').click(function () {
  updateCrawlerConfiguration(updateConfigs.val());
});

$('#stopBtn').click(function () {
  updateCrawlerConfiguration(JSON.stringify([{ op: 'replace', path: '/crawler/count', value: 0 }]));
});

$('#queueRequestsBtn').click(function () {
  queueRequests(requests.val());
});

$('#recreateQueueBtn').click(function () {
  queueModal.modal('hide');
  recreateQueue(recreateQueueName.val());
});

$('#getRequestsBtn').click(function () {
  getRequests(getQueueName.val(), getCount.val());
});

$('#deleteRequestsBtn').click(function () {
  requestsModal.modal('hide');
  getRequests(getQueueName.val(), getCount.val(), true);
});

$('#refreshDeadletterBtn').click(function () {
  listDeadletters();
});

$('#deleteDeadletterBtn').click(function () {
  deleteDeadletterItems();
});

$('#requeueDeadletterBtn').click(function () {
  deleteDeadletterItems(true);
});

function retrieveCrawlerConfiguration() {
  $.get('/config', function (data, status, xhr) {
    if (status === 'success') {
      crawlerUrl.text(data.crawler.url);
      currentConfigs.text(JSON.stringify(data, null, 2));
      displayAlert(currentConfigsAlert, false, 'Success!');
    } else {
      displayAlert(currentConfigsAlert, true, xhr ? xhr.responseText : 'Error');
    }
  });
}

function updateCrawlerConfiguration(payload) {
  $.ajax({
    type: 'PATCH',
    url: '/config',
    data: payload,
    contentType: 'application/json; charset=utf-8',
    success: function () {
      displayAlert(updateConfigsAlert, false, 'Success!');
      retrieveCrawlerConfiguration();
    },
    error: function (xhr) {
      displayAlert(updateConfigsAlert, true, (xhr && xhr.responseText) ? xhr.responseText : 'Error');
    }
  });
}

function recreateQueue(name) {
  recreateQueueResponse.text('Recreating the queue...');
  $.ajax({
    type: 'PUT',
    url: `/queue/${name}`,
    success: function (data, status, xhr) {
      recreateQueueResponse.text(JSON.stringify(data, null, 2));
      displayAlert(queueAlert, false, 'Success!');
    },
    error: function (xhr) {
      var message = 'Error';
      if (xhr && xhr.responseText) {
        try {
          message = JSON.parse(xhr.responseText).message;
        } catch (err) {
          message = xhr.responseText;
        }
      }
      recreateQueueResponse.text('');
      displayAlert(queueAlert, true, message);
    }
  });
}

function queueRequests(payload) {
  $.ajax({
    type: 'POST',
    url: '/requests/normal',
    data: payload,
    contentType: 'application/json; charset=utf-8',
    success: function () {
      displayAlert(queueRequestsAlert, false, 'Success!');
    },
    error: function (xhr) {
      displayAlert(queueRequestsAlert, true, (xhr && xhr.responseText) ? xhr.responseText : 'Error');
    }
  });
}

function getRequests(queue, count, remove) {
  count = count || 1;
  var type = remove ? 'DELETE' : 'GET';
  $.ajax({
    type: type,
    url: `/requests/${queue}?count=${count}`,
    success: function (data, status, xhr) {
      requestList.text(JSON.stringify(data, null, 2));
      displayAlert(getRequestsAlert, false, 'Success!');
    },
    error: function (xhr) {
      var message = 'Error';
      if (xhr && xhr.responseText) {
        try {
          message = JSON.parse(xhr.responseText).message;
        } catch (err) {
          message = xhr.responseText;
        }
      }
      displayAlert(getRequestsAlert, true, message);
    }
  });
}

function listDeadletters() {
  shouldReloadDeadlettersTable = true;
  $('#deadletterList').jsGrid('loadData').done(function () {
    displayAlert(deadletterAlert, false, 'Deadletters refreshed!');
  });
}

function deleteDeadletterItems(shouldRequeue) {
  shouldRequeue ? requeueDeadletterModal.modal('hide') : deleteDeadletterModal.modal('hide');
  if (selectedItems.length === 0) {
    var message = 'Nothing to ' + (shouldRequeue ? 'requeue!' : 'delete!');
    return displayAlert(deadletterAlert, false, message);
  }
  displayAlert(deadletterAlert, false, 'Processing ' + selectedItems.length + ' deadletters...');
  shouldReloadDeadlettersTable = true;
  var promises = [];
  $.each(selectedItems, function () {
    var url = '/deadletters/' + encodeURIComponent(this.urn);
    if (shouldRequeue) {
      url += '?requeue=' + encodeURIComponent('soon');
    }
    var def = new $.Deferred();
    $.ajax({
      url: url,
      type: 'DELETE',
      dataType: 'json',
      success: function (data, status, xhr) {
        def.resolve();
      },
      error: function (xhr) {
        def.reject();
      }
    });
    promises.push(def);
  });
  return $.when.apply(undefined, promises).then(() => {
    $('#deadletterList').jsGrid('loadData').done(function () {
      var message = (shouldRequeue ? 'Deadletters requeued!' : 'Deadletters deleted!');
      displayAlert(deadletterAlert, false, message);
    });
  }, (error) => {
    displayAlert(deadletterAlert, true, 'Error');
  });
}

function displayAlert(element, isError, body) {
  element.html(body);
  element.addClass(isError ? 'alert-danger' : 'alert-success');
  element.removeClass(isError ? 'alert-success' : 'alert-danger');
  element.toggle(500).delay(isError ? 4000 : 1000).toggle(500);
}

var data = null;
var selectedItems = [];
var shouldReloadDeadlettersTable = false;
var isSelectChecked;
var deadletterText = $('#deadletterText');

$('#deadletterList').jsGrid({
  width: '100%',
  height: '400px',

  filtering: true,
  editing: false,
  sorting: true,
  paging: false,
  autoload: true,

  rowClick: function (args) {
    var selectedCount = 0;
    $('input[type=checkbox]').each(function () {
      if ($(this).is(':checked')) {
        selectedCount++;
      }
    });
    displayDeadletterCount(deadletterSelectedCount, 'Selected', selectedCount);
    $.ajax({
      url: '/deadletters/' + encodeURIComponent(args.item.urn),
      dataType: 'json',
      success: function (data, status, xhr) {
        deadletterText.text(JSON.stringify(data, null, 2));
      },
      error: function (xhr) {
        var message = 'Error';
        if (xhr && xhr.responseText) {
          try {
            message = JSON.parse(xhr.responseText).message;
          } catch (err) {
            message = xhr.responseText;
          }
        }
        deadletterText.text('');
        displayAlert(deadletterAlert, true, message);
      }
    });
  },

  controller: {
    loadData: function (filter) {
      deadletterText.text('');
      selectedItems = [];
      if (data === null || shouldReloadDeadlettersTable) {
        shouldReloadDeadlettersTable = false;
        var d = $.Deferred();
        $.ajax({
          url: '/deadletters',
          dataType: 'json'
        }).done(function (response) {
          data = response;
          displayDeadletterCount(deadletterTotalCount, 'Total', data.length);
          displayDeadletterCount(deadletterSelectedCount, 'Selected', selectedItems.length);
          displayDeadletterCount(deadletterFilteredCount, 'Filtered', 0);
          d.resolve(response);
        });
        return d.promise();
      } else {
        var grepResult = $.grep(data, function (item) {
          var typeMatches = !filter.type || getType(item).toLowerCase().indexOf(filter.type.toLowerCase()) > -1;
          var pathMatches = !filter.path || getPath(item).toLowerCase().indexOf(filter.path.toLowerCase()) > -1;
          var reasonMatches = !filter.reason || getReason(item).toLowerCase().indexOf(filter.reason.toLowerCase()) > -1;
          var proceesedDateMatches = !filter.processedDate || getProcessedDate(item).toLowerCase().indexOf(filter.processedDate.toLowerCase()) > -1;
          return typeMatches && pathMatches && reasonMatches && proceesedDateMatches;
        });
        displayDeadletterCount(deadletterFilteredCount, 'Filtered', grepResult.length);
        return grepResult;
      }
    }
  },

  fields: [
    { name: 'select', title: 'Select', type: 'checkbox', width: 50, itemTemplate: getSelect, filterValue: getFilterValue },
    { name: 'type', title: 'Type', type: 'text', width: 80, itemTemplate: getType },
    { name: 'path', title: 'Path', type: 'text', itemTemplate: getPath },
    { name: 'reason', title: 'Reason', type: 'text', itemTemplate: getReason },
    { name: 'processedDate', title: 'Processed date', type: 'text', itemTemplate: getProcessedDate }
  ]
});

function displayDeadletterCount(element, text, total) {
  element.html(text + ': <span class="badge">' + total + '</span>');
}

function getSelect(value, item) {
  var cbxSelectItem = $('<input type="checkbox">');
  if (isSelectChecked) {
    cbxSelectItem = $('<input type="checkbox" checked="true">');
    selectItem(item);
  }

  $(cbxSelectItem).on('change', function () {
    $(this).is(':checked') ? selectItem(item) : unselectItem(item);
  });
  displayDeadletterCount(deadletterSelectedCount, 'Selected', selectedItems.length);
  return cbxSelectItem;
}

function getFilterValue() {
  isSelectChecked = this.filterControl.get(0).indeterminate
    ? undefined
    : this.filterControl.is(':checked');
}

function selectItem(item) {
  selectedItems.push(item);
}

function unselectItem(item) {
  var index = selectedItems.indexOf(item);
  if (index != -1) {
    selectedItems.splice(index, 1);
  }
}

function getType(value, item) {
  return (item || value).extra.type || '';
}

function getReason(value, item) {
  return (item || value).extra.reason || '';
}

function getPath(value, item) {
  var parser = document.createElement('a');
  parser.href = (item || value).extra.url;
  return parser.pathname;
}

function getProcessedDate(value, item) {
  return (item || value).fetchedat || '';
}
