<?php
$type = $_GET["type"];
$filename = $_GET["filename"];
$fn_arr = explode("_", $filename);

$curr_datestr = $fn_arr[0];
$netid = $fn_arr[1];
$formid = $fn_arr[2];
// var_dump($curr_datestr, $netid, $formid);
// $datenum = strtotime($curr_datestr);
// print($datenum);

$template_file = "json/templates.json";
if (file_exists($template_file)) {
  $json_template = file_get_contents($template_file);
  $decoded_template = json_decode($json_template, true);
  // var_dump($template);
} else {
  echo "Template file doesn't exist";
  exit;
}

if ($type == "student") { /* Student Evaluation */
  $form_url = "studentResponses/$filename.json";
  $template = $decoded_template["Student Evaluation"];
} else {  /* Group Evaluation */
  $form_url = "groupResponses/$filename.json";
  $template = $decoded_template["Group Evaluation"];
}

if (!isset($_POST["data"])) { /* GET request */
  
  if ($type == "student") {
    $fn_pattern = "studentResponses/*_$netid\_$formid.json";
  } else {
    $fn_pattern = "groupResponses/*_$netid\_$formid.json";
  }

  // compare datetime of all existing form responses, return most recent response
  $matched_files = glob($fn_pattern);
  if (sizeof($matched_files) == 0) {
    print_r(json_encode($template));
  } else {
    rsort($matched_files); // most recent response should now be in index 0
    $data = file_get_contents($matched_files[0]);
    $decoded_data = json_decode($data, true);
    if ($type == "student") {
      $form_data = $decoded_data["Student Evaluation"];
    } else {
      $form_data = $decoded_data["Group Evaluation"];
    }
    print(json_encode($form_data));
  }

} else { /* POST request */

  $data = $_POST["data"];
  $form_details = $data["details"];
  $form_data = $data["data"];
  // var_dump($data, $form_details, $form_data);

  foreach ($form_data as $key => $value) {
    $template[$key]["Value"] = $value;
  }
  // print_r(json_encode($template));

  if ($type == "student") {
    $data = array(
      "Details" => array(
        "Date" => $curr_datestr,
        "Student" => str_replace('_', ' ', $form_details["Name"]),
        "Group" => $form_details["Group"],
        "Evaluated By" => $netid
      ), 
      "Student Evaluation" => $template
    );
  } else {
    $data = array(
      "Details" => array(
        "Date" => $curr_datestr,
        "Group" => $form_details["Group"],
        "Evaluated By" => $netid
      ), 
      "Group Evaluation" => $template
    );
  }

  print_r(json_encode($data));
  file_put_contents($form_url, json_encode($data));
}
?>
