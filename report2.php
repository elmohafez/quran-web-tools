<?php
  date_default_timezone_set("Asia/Qatar");
  ini_set('error_log', 'reports2.log');
  if (!isset($_POST['page_id'])) return;
  $page_id = $_POST['page_id'];
  error_log($_SERVER['REMOTE_ADDR']." reporting glyph matching error in ".$page_id.":".$_POST['note']." User-Agent: ".$_SERVER['HTTP_USER_AGENT']);
  header("Access-Control-Allow-Origin: null");
  echo("Thank you for reporting ".$page_id);
?>