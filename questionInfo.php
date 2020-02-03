<?php
$studentInfo = $_GET["studentInfo"];
$file = "studentInfo/$studentInfo.json";

if (!isset($_POST["data"])) { /* GET request */
  $data = (file_exists($file)) ? file_get_contents($file) : file_get_contents("json/questionnaire.json");
  if (file_exists($file)) {
    $decoded_data = json_decode($data);
    print(json_encode($decoded_data->formData));
  } else {
    print($data);
  }
} else {  /* POST request */
  $studentData = json_decode("{}");

  $dataArray = str_replace("Group", "", explode("_", $studentInfo));
  $group_id = $dataArray[0];
  if (count($dataArray) == 4) { // students with two first names
    $first_name = $dataArray[1] . " " . $dataArray[2];
    $last_name = $dataArray[3];
  } else {
    $first_name = $dataArray[1];
    $last_name = $dataArray[2];
  }

  $studentData->firstname = $first_name;
  $studentData->lastname = $last_name;
  $studentData->groupid = $group_id;

  $encoded_data = json_decode("{}");
  $encoded_data->studentData = $studentData;
  $encoded_data->formData = $_POST['data'];
  file_put_contents($file, json_encode($encoded_data));
  print(json_encode($encoded_data));
}
?>
