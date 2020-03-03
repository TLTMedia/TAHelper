<?php
$request = $_GET['request'];
$type = $_GET['type'];
// print($request)

$group_data = $_POST['groups'];
$group_filter = implode(",", $group_data);
// print_r($group_data);

if ($request == "clear") {  /* Clear request */
  array_map('unlink', glob($type . "Responses/Group{" . $group_filter . "}*", GLOB_BRACE));
  // foreach (glob($type . "Responses/Group{" . $group_filter . "}*", GLOB_BRACE) as $pathname) {
  //   unlink($pathname);
  // }

} else {  /* Download request */

  header('Content-type: text/csv');
  header('Content-disposition: attachment; filename=responses.csv');
  $outfile = fopen('php://output', 'w');

  if ($type == "student") { // student responses
    $header = array("Last Name", "First Name", "Group ID");
    $filename = "json/questionnaire.json";
  } else {  // group responses
    $header = array("Group ID");
    $filename = "json/evaluation.json";
  }
  // print_r(implode(',', $header));
  // $typeMap=array("Student"=>"studt")

  $form_data = file_get_contents($filename);
  $decoded_formdata = json_decode($form_data);
  // print_r($decoded_formdata);

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

  foreach (glob($type . "Responses/Group{" . $group_filter . "}*", GLOB_BRACE) as $pathname) {
      $replace = array(".json", "Group");
      list($dir, $filename) = explode("/", $pathname);
      $info = str_replace($replace, "", explode("_", $filename));

      if ($type == "group") { // group responses
        $group_id = $info[0];
        $entry = array($group_id);

      } else {  // student responses

        // for students with two first names
        if (count($info) == 4) {
          list($group_id, $fn1, $fn2, $last_name) = $info;
          $first_name = $fn1 . " " . $fn2;
        } else {
          list($group_id, $first_name, $last_name) = $info;
        }

        $entry = array($last_name, $first_name, $group_id);
      }
      // print_r(implode(',', $entry));

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
        array_push($entry, $response);
      }

      // print_r(implode(',', $stud_array));
      // echo '<br/>';
      fputcsv($outfile, $entry);
  }
}
?>
