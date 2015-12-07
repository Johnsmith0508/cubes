<html>
  <body>
    <h1>Dont look</h1>
    <pre>
      <?php 
      $out = `systemctl status cubeserver`;
      echo $out;
      echo `journalctl -u cubeserver 2>&1`;
      ?>
    </pre>
    </body>
</html>