<?php
$type = $_GET["type"];
$filename = $_GET["filename"];

if ($type == "Student") { // student responses
  $formURL = "studentResponses/$filename.json";
  $template = "json/questionnaire.json";
} else {  // group responses
  $formURL = "groupResponses/$filename.json";
  $template = "json/evaluation.json";
}

if (!isset($_POST["data"])) { /* GET request */
  if (file_exists($formURL)) {
    $data = file_get_contents($formURL);
    $decoded_data = json_decode($data);
    print(json_encode($decoded_data->formData));
  } else {
    $data = file_get_contents($template);
    print($data);
  }
} else {
  $data = json_decode("{}");

  if ($type == "Student") {  /* Student POST request */
    $dataArray = str_replace("Group", "", explode("_", $filename));

    $group_id = $dataArray[0];
    if (count($dataArray) == 4) { // students with two first names
      $first_name = $dataArray[1] . " " . $dataArray[2];
      $last_name = $dataArray[3];
    } else {
      $first_name = $dataArray[1];
      $last_name = $dataArray[2];
    }

  } else if ($type == "Group") {  /* Group POST request */
    include "iam.php";
    $taInfo = getTAInfo();

    $first_name = $taInfo->nickname;
    $last_name = $taInfo->sn;
    $group_id = str_replace("Group", "", $filename);
  }

  $data->firstname = $first_name;
  $data->lastname = $last_name;
  $data->groupid = $group_id;

  $decoded_data = json_decode("{}");
  if ($type == "Student") {
    $decoded_data->studentData = $data;
  } else {
    $decoded_data->taData = $data;
  }
  $decoded_data->formData = $_POST['data'];

  file_put_contents($formURL, json_encode($decoded_data));
  print(json_encode($decoded_data));
}
?>
