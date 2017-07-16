
// Declare globals
data = [];
environment_data = [];
answer_data = [];
questions = [];
responses = [];
cur_file = 0;
total_files = 0;
question_types = {
    "0": "Tokens",
    "1": "Multi-Choice",
    "2": "Yes/No",
    "3": "Location",
    "4": "People",
    "5": "Number",
    "6": "Note"
};


// On load, add event listeners for file dialog
window.onload = function() {
    $('#fileImportProgressBar').hide();   // hide the progress bar for now

    fileInput.addEventListener('change', function(e) {
        //var fileDisplayArea = document.getElementById('fileDisplayArea');
        setup_file_count(fileInput.files.length);

        var i;
        for (i = 0; i < fileInput.files.length; i++) {
            setup_reader(fileInput.files[i]);
        }
    });
};

function setup_reader(file) {
    var fileDisplayArea = document.getElementById('fileDisplayArea');
    var fileNamePattern = /\d{4}\-\d{2}\-\d{2}\-reporter\-export\.json/;

    // Check to see if the file format is correct
    // TODO

    var reader = new FileReader();
    reader.onload = function(e) {
        //fileDisplayArea.innerText = reader.result;
        var file_json = JSON.parse(reader.result);
        data.push(file_json);

        if(file.name.match(fileNamePattern)){
            fileDisplayArea.innerText += file.name + ' loaded\n';
        }
        else {
            fileDisplayArea.innerText += 'Couldn\t load file ' + file.name + '\n';
        }
        update_file_count()
    };
    reader.readAsText(file);
}

function update_file_count() {
    var file_count_current = document.getElementById('file_count_current');

    file_count_current.innerText = parseInt(file_count_current.innerText)+1;
    cur_file++;
    var perc = 100*cur_file/total_files;
    $('#fileImportProgressBar .progress-bar').attr('aria-valuenow', perc).css('width', perc+'%').html(perc+'%');
}

function setup_file_count(total) {
    var file_count_total = document.getElementById('file_count_total');
    var file_count_current = document.getElementById('file_count_current');

    file_count_total.innerText = total;
    file_count_current.innerText = '0';
    total_files = total;
    $('#fileImportProgressBar').show();
}


function export_environment_data() {
    var load_data = $('#data');

    var fields = ['date', 'battery', 'location.latitude', 'location.longitude', 'location.placemark.country',
        'location.placemark.administrativeArea', 'location.placemark.locality',
        'location.placemark.subLocality', 'weather.tempF'];
    environment_data.push(fields);

    $.each(data, function(index_file, f) {
        $.each(f['snapshots'], function( index_snapshot, v ) {
            environment_data.push(
                _.map(fields, function (field) { return _.get(v, field); })
            );
        });
    });

    //load_data.html(array_of_arrays_to_csv(environment_data));
    export_csv_data(array_of_arrays_to_csv(environment_data), 'environment_data.csv');
}


function export_answer_data() {
    var load_data = $('#data');

    var questions = _.uniq(JSPath.apply('.snapshots.responses.questionPrompt', data));
    answer_data.push(questions);

    $.each(data, function(index_file, f) {
        $.each(f['snapshots'], function( index_snapshot, s ) {

            var snapshot_responses = _.map(questions, function (question) {
                $.each(s['responses'], function ( index_response, r) {
                    if(r['questionPrompt'] === question) { return r['uniqueIdentifier']; }
                });
            });
            answer_data.push(snapshot_responses);


        });
    });

    load_data.html(array_of_arrays_to_csv(answer_data));
    //export_csv_data(array_of_arrays_to_csv(answer_data), 'answer_data.csv');
}


function array_of_arrays_to_csv(a) {
    var rows = [];
    $.each(a, function(i, r) {
        rows.push(r.join());
    });
    return rows.join('\n');
}

function export_csv_data(csv_string, file_name) {
    //var encodedUri = encodeURI(s);
    //window.open(encodedUri);

    //var encodedUri = encodeURI(csvContent);
    var blob = new Blob([csv_string], {type: "text/csv"});

    var link = document.createElement("a");
    //link.setAttribute("href", encodedUri);
    link.setAttribute('href', window.URL.createObjectURL(blob));
    link.setAttribute("download", file_name);
    document.body.appendChild(link); // Required for FF

    link.click(); // This will download the data file named "my_data.csv".
}
