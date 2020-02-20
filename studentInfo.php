<?php
header('Content-type: text/csv');
header('Content-disposition: attachment; filename=Student Evaluations.csv');

$outfile = fopen('php://output', 'w');
$header = array("Last Name", "First Name", "Group");
// print_r(implode(',', $header));

$filename = "json/questionnaire.json";
$form_data = file_get_contents($filename);
$decoded_formdata = json_decode($form_data);
// print_r($decoded_formdata);

$group_data = $_POST['groups'];
$group_filter = implode(",", $group_data);
// print_r($group_data);

foreach ($decoded_formdata as $form_elem) {
  // print_r($form_elem);
  $question = $form_elem->class;
  if (!in_array($question, $header)) {
    array_push($header, $question);
  }
}
// print_r(implode(',', $header));
// echo '<br/>';
fputcsv($outfile, $header);

foreach (glob("studentInfo/Group{" . $group_filter . "}*", GLOB_BRACE) as $pathname) {
    // echo "$pathname size " . filesize($pathname) . "\n";

    list($dir, $filename) = explode("/", $pathname);

    $replace = array(".json", "Group");
    $stud_info = str_replace($replace, "", explode("_", $filename));

    // for students with two first names
    if (count($stud_info) == 4) {
      list($group_id, $fn1, $fn2, $last_name) = $stud_info;
      $first_name = $fn1 . " " . $fn2;
    } else {
      list($group_id, $first_name, $last_name) = $stud_info;
    }

    $stud_array = array($last_name, $first_name, $group_id);
    // print_r(implode(',', $stud_array));

    $raw_data = file_get_contents($pathname);
    $json_data = json_decode($raw_data);
    // print_r($json_data);

    foreach ($json_data->formData as $form_elem) {
      // print_r($form_elem);
      $input_type = $form_elem->type;
      switch ($input_type) {
        case 'textarea':
          $response = $form_elem->html;
          break;
        default:
          $response = $form_elem->value;
      }
      array_push($stud_array, $response);
    }

    // print_r(implode(',', $stud_array));
    // echo '<br/>';
    fputcsv($outfile, $stud_array);
}

// echo "cell 1, cell 2";
?>
