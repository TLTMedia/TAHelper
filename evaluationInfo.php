<?php
$groupInfo = $_GET["groupInfo"];
$file = "groupInfo/$groupInfo.json";

if (!isset($_POST["data"])) { /* GET request */
  $data = (file_exists($file)) ? file_get_contents($file) : file_get_contents("json/evaluation.json");
  if (file_exists($file)) {
    $decoded_data = json_decode($data);
    print(json_encode($decoded_data->formData));
  } else {
    print($data);
  }
} else {  /* POST request */
  include "iam.php";

  $taInfo = getTAInfo();
  $split_info = explode("_", $groupInfo);

  $groupData = json_decode("{}");
  $groupData->id = "Group " . $split_info[1];
  $groupData->TA = $taInfo->nickname . " " . $taInfo->sn;

  $decoded_data = json_decode("{}");
  $decoded_data->groupData = $groupData;
  $decoded_data->formData = $_POST['data'];

  file_put_contents($file, json_encode($decoded_data));
  print(json_encode($decoded_data));
}
?>
