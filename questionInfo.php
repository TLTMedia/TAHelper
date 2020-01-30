<?php
include("iam.php");

$studentInfo = getStudentInfo();
$studentName = $_GET["studentName"];
$file = "studentInfo/$studentName.json";

if (!isset($_POST["data"])) {
  $data = (file_exists($file)) ? file_get_contents($file) : file_get_contents("json/questionnaire.json");
  if (file_exists($file)) {
    $decoded_data = json_decode($data);
    print(json_encode($decoded_data->formData));
  } else {
    print($data);
  }
} else {
  $encoded_data = json_decode("{}");
  $encoded_data->studentData = $studentInfo;
  $encoded_data->formData = $_POST['data'];
  file_put_contents($file, json_encode($encoded_data));
  print(json_encode($encoded_data));
}
?>
