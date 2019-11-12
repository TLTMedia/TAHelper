<?php
$studentName = $_GET["studentName"];
$file = "questionInfo/$studentName.json";

  if (!isset($_POST["data"])) {
    $data = (file_exists($file)) ? file_get_contents($file) : file_get_contents("json/questionnaire.json");
    print($data);
  } else {
    file_put_contents($file, json_encode($_POST['data']));
    print(json_encode($_POST['data']));
  }
?>
