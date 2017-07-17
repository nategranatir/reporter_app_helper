
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

    var questions_question_types = {};
    $.each(data, function (index_file, f) {
        $.each(f['questions'], function (index_q, q) {
            questions_question_types[q['prompt'].trim()] = q['questionType'];
        });
    });
    var question_prompts = _.uniq(JSPath.apply('.snapshots.responses.questionPrompt', data));
    answer_data.push(['date'].concat(question_prompts));


    var snapshot_responses;

    $.each(data, function(index_file, f) {
        $.each(f['snapshots'], function( index_snapshot, s ) {

            snapshot_responses = {};
            $.each(s['responses'], function (index_response, r) {
                snapshot_responses[r['questionPrompt']] = process_response(r, questions_question_types);
            });

            var snapshot_responses_ordered = _.map(question_prompts, function (question_prompt) {
                return _.get(snapshot_responses, question_prompt, '')
            });

            snapshot_responses_ordered = [s['date']].concat(snapshot_responses_ordered);

            answer_data.push(snapshot_responses_ordered);
        });
    });

    // load_data.html(array_of_arrays_to_csv(answer_data));
    export_csv_data(array_of_arrays_to_csv(answer_data), 'answer_data.csv');
}

function process_response(r, questions_question_types) {
    var question_type = questions_question_types[r['questionPrompt'].trim()];
    switch(question_type) {
        case 0:     // Tokens
            var tokens = _.map(r['tokens'], function (t) { return t['text']; });
            return tokens.join('|');
        case 1:     // Multi-Choice
            return 'Not yet implemented';
        case 2:     // Yes/No
            return r['answeredOptions'][0];
        case 3:     // Location
            var location_response = _.get(r, 'locationResponse');
            return _.get(location_response, 'text');
            // TODO: should also return r['locationResponse']['location']['latitude']/['longitude']
        case 4:     // People
            var tokens = _.map(r['tokens'], function (t) { return t['text']; });
            return tokens.join('|');
        case 5:     // Number
            return r['numericResponse'];
        case 6:     // Note
            return 'Not yet implemented';
        default:
            return 'Not yet implemented'
    }
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
