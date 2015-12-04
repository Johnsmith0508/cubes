<html>
  <body>
    <h1>Dont look</h1>
    <pre>
      <?php 
      $out = `systemctl status cubeserver`;
      echo $out;
      ?>
    </pre>
    </body>
</html>