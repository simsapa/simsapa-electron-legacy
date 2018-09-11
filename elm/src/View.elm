module View exposing (view)

import Browser
import Msg exposing (Msg(..))
import Model exposing (Model)
import Url
import Html exposing (..)
import Html.Attributes exposing (..)


view : Model -> Browser.Document Msg
view model =
    { title = "Simsapa Dhamma Reader"
    , body =
        [ text "Current url is: "
        , b [] [ text (Url.toString model.url) ]
        , ul []
            [ viewLink "/home"
            , viewLink "/profile"
            , viewLink "/reviews/the-century-of-the-self"
            , viewLink "/reviews/public-opinion"
            , viewLink "/reviews/shah-of-shahs"
            ]
        ]
    }


viewLink : String -> Html msg
viewLink path =
    li [] [ a [ href path ] [ text path ] ]


