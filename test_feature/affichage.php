<?php

//variables pré-rempli pour la voiture
$places_deja_prises = [1, 2, 3, 5, 7, 9, 10, 12, 14, 15];
$total_places = 24;
$places_par_rangee = 12;

//fonction pour faire une séparation entre les sièfes pour simuler 
//une vrai disposition dans une voiture de train
function a_besoin_d_espace($numero) {
    $espaces_apres = [3, 4, 5, 6, 7, 8, 10, 11];
    return in_array($numero, $espaces_apres) ? 'style="margin-right: 20px;"' : '';
}
?>

<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Réservation Train</title>
    <link rel="stylesheet" href="affichage.css">
</head>
<body>

    <h3>Voiture n°1</h3>

    <div class="voiture">
        <form method="POST" action="traitement.php">
            
            <?php 
            for ($rangee = 0; $rangee < 2; $rangee++) { 
                echo '<div class="rangee">';
                
                for ($i = 1; $i <= $places_par_rangee; $i++) {
                    $numero_siege = $i + ($rangee * $places_par_rangee);
                    $est_pris = in_array($numero_siege, $places_deja_prises);
                    $style_espace = a_besoin_d_espace($i);

                    if ($est_pris) {
                        //place déja prise -> impossible de modifier 
                        echo "<div class='siege indisponible' $style_espace>$numero_siege</div>";
                    } else {
                        //place libre -> modification permise
                        echo "<input type='checkbox' name='places[]' value='$numero_siege' id='place_$numero_siege'>";
                        echo "<label class='siege' for='place_$numero_siege' $style_espace>$numero_siege</label>";
                    }
                }
                echo '</div>';
            } 
            ?>
            
        </form>
    </div>

</body>
</html>