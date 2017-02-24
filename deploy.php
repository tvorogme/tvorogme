<?php
    $commands = array(
        'git pull'
    );

    
    $output = '';
    foreach($commands AS $command){
        shell_exec($command);
    }
?>

<!DOCTYPE HTML>
<html lang="en-US">
<head>
    <meta charset="UTF-8">
    <title></title>
</head>
<body>
</body>
</html>

