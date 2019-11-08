<?php
  header('Content-type: application/json');

  $info = array("cn", "eppn", "givenName", "mail", "nickname", "sn");
  $infoDict = json_decode("{}");

  foreach ($info as $i) {
    $infoDict->{$i} = $_SERVER[$i];
  }

  print_r(json_encode($infoDict));
?>
