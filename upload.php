<?php

$filterImageType = array('image/gif', 'image/jpeg', 'image/png', 'image/vnd.microsoft.icon'
					,'image/bmp', 'image/jpg');
$file = $_FILES["imageFile"];
$filePath = 'upload/';
if (in_array($file["type"], $filterImageType) && ($file["size"] < 2000000))
{
	if ($file["error"] > 0)
	{
		echo json_encode(array('state' => 'fail', 'msg' => "{$file["error"]}"));
	}
	else
	{
		$fileName = time().$file["name"];
		if (file_exists("{$filePath}{$fileName}"))
		{
			echo json_encode(array('state' => 'fail'
				, 'msg' => "{$fileName} already exists"));
		}
		else
		{
			if (move_uploaded_file($file["tmp_name"], "{$filePath}{$fileName}"))
			{
				echo json_encode(array('state' => 'ok', 'msg' => "{$filePath}{$fileName}"));
			}
			else
			{
				echo json_encode(array('state' => 'fail', 'msg' => 'save file failed'));
			}
		}
	}
}
else
{
	echo json_encode(array('state' => 'fail', 'msg'=>'Invalid file'));
}
?>