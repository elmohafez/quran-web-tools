<?php
  date_default_timezone_set("Asia/Qatar");
  ini_set('error_log', 'reports.log');
  if (!isset($_POST['qaree_id']) || !isset($_POST['sura_id']) || !isset($_POST['aya_id'])) return;
  $qaree_id = $_POST['qaree_id'];
  $sura_id = $_POST['sura_id'];
  $aya_id = $_POST['aya_id'];
  error_log($_SERVER['REMOTE_ADDR']." reporting segmentation error in ".$qaree_id.":".$sura_id.":".$aya_id.":".$_POST['note']." User-Agent: ".$_SERVER['HTTP_USER_AGENT']);
  header("Access-Control-Allow-Origin: null");
  echo("Thank you for reporting ".$qaree_id.":".$sura_id.":".$aya_id);
?>